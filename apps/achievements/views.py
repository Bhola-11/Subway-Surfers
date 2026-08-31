import json
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST
from django.shortcuts import get_object_or_404
from .models import Achievement, UserAchievement
from apps.players.models import PlayerProfile

DEFAULT_ACHIEVEMENTS = [
    {'code': 'first_steps', 'name': 'First Steps', 'description': 'Run a distance of 500 meters in total.', 'icon': '👟', 'category': 'DISTANCE', 'target_value': 500, 'reward_coins': 100, 'reward_gems': 1, 'order': 1},
    {'code': 'marathoner', 'name': 'Metro Marathoner', 'description': 'Run a total distance of 5,000 meters.', 'icon': '🏃', 'category': 'DISTANCE', 'target_value': 5000, 'reward_coins': 500, 'reward_gems': 5, 'order': 2},
    {'code': 'globetrotter', 'name': 'Speed Nomad', 'description': 'Run a total distance of 20,000 meters.', 'icon': '🌍', 'category': 'DISTANCE', 'target_value': 20000, 'reward_coins': 2000, 'reward_gems': 15, 'order': 3},
    {'code': 'coin_starter', 'name': 'Pocket Money', 'description': 'Collect 250 coins.', 'icon': '🪙', 'category': 'COINS', 'target_value': 250, 'reward_coins': 150, 'reward_gems': 2, 'order': 4},
    {'code': 'coin_tycoon', 'name': 'Vault Breaker', 'description': 'Collect 2,500 coins in total.', 'icon': '💰', 'category': 'COINS', 'target_value': 2500, 'reward_coins': 1000, 'reward_gems': 10, 'order': 5},
    {'code': 'score_bronze', 'name': 'Cadet Runner', 'description': 'Reach a high score of 5,000 in a single run.', 'icon': '🥉', 'category': 'SCORE', 'target_value': 5000, 'reward_coins': 200, 'reward_gems': 2, 'order': 6},
    {'code': 'score_silver', 'name': 'Pro Dasher', 'description': 'Reach a high score of 25,000 in a single run.', 'icon': '🥈', 'category': 'SCORE', 'target_value': 25000, 'reward_coins': 1000, 'reward_gems': 8, 'order': 7},
    {'code': 'score_gold', 'name': 'Metro Legend', 'description': 'Reach an epic high score of 100,000.', 'icon': '🥇', 'category': 'SCORE', 'target_value': 100000, 'reward_coins': 5000, 'reward_gems': 25, 'order': 8},
    {'code': 'power_hungry', 'name': 'Overcharged', 'description': 'Collect 20 power-ups during your runs.', 'icon': '⚡', 'category': 'POWERUPS', 'target_value': 20, 'reward_coins': 400, 'reward_gems': 3, 'order': 9},
    {'code': 'train_surfer', 'name': 'Subway Veteran', 'description': 'Complete 10 runs in Metro Rush.', 'icon': '🚇', 'category': 'RUNS', 'target_value': 10, 'reward_coins': 300, 'reward_gems': 4, 'order': 10},
]

def seed_achievements():
    for ach in DEFAULT_ACHIEVEMENTS:
        Achievement.objects.get_or_create(
            code=ach['code'],
            defaults=ach
        )

@require_GET
def get_achievements_api(request):
    seed_achievements()
    achievements = Achievement.objects.all().order_by('order')

    user_progress_map = {}
    if request.user.is_authenticated:
        for ua in UserAchievement.objects.filter(user=request.user).select_related('achievement'):
            user_progress_map[ua.achievement_id] = {
                'current_progress': ua.current_progress,
                'is_unlocked': ua.is_unlocked,
                'is_claimed': ua.is_claimed,
            }

    data = []
    for a in achievements:
        user_data = user_progress_map.get(a.id, {'current_progress': 0, 'is_unlocked': False, 'is_claimed': False})
        progress_pct = min(100, int((user_data['current_progress'] / a.target_value) * 100)) if a.target_value > 0 else 0

        data.append({
            'id': a.id,
            'code': a.code,
            'name': a.name,
            'description': a.description,
            'icon': a.icon,
            'category': a.category,
            'target_value': a.target_value,
            'reward_coins': a.reward_coins,
            'reward_gems': a.reward_gems,
            'current_progress': user_data['current_progress'],
            'progress_pct': progress_pct,
            'is_unlocked': user_data['is_unlocked'],
            'is_claimed': user_data['is_claimed'],
        })

    return JsonResponse({'status': 'success', 'achievements': data})


@require_POST
def claim_achievement_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Authentication required.'}, status=401)

    try:
        payload = json.loads(request.body.decode('utf-8'))
        ach_id = payload.get('achievement_id')
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON.'}, status=400)

    user_ach = get_object_or_404(UserAchievement, user=request.user, achievement_id=ach_id)

    if not user_ach.is_unlocked:
        return JsonResponse({'status': 'error', 'message': 'Achievement not yet unlocked.'}, status=400)

    if user_ach.is_claimed:
        return JsonResponse({'status': 'error', 'message': 'Reward already claimed.'}, status=400)

    user_ach.is_claimed = True
    user_ach.claimed_at = timezone.now()
    user_ach.save()

    # Credit rewards
    profile = get_object_or_404(PlayerProfile, user=request.user)
    profile.total_coins += user_ach.achievement.reward_coins
    profile.total_gems += user_ach.achievement.reward_gems
    profile.save()

    return JsonResponse({
        'status': 'success',
        'message': f"Claimed {user_ach.achievement.reward_coins} coins & {user_ach.achievement.reward_gems} gems!",
        'total_coins': profile.total_coins,
        'total_gems': profile.total_gems
    })
