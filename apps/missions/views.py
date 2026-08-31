import json
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST
from django.shortcuts import get_object_or_404
from .models import Mission, UserMission
from apps.players.models import PlayerProfile

DEFAULT_MISSIONS = [
    {'code': 'daily_coins_100', 'title': 'Coin Collector', 'description': 'Collect 150 coins in runs today.', 'mission_type': 'DAILY', 'objective_type': 'COINS_TOTAL', 'target_value': 150, 'reward_coins': 200, 'reward_gems': 1, 'icon': '🪙'},
    {'code': 'daily_dist_1000', 'title': 'Subway Sprinter', 'description': 'Run a total of 1,200 meters today.', 'mission_type': 'DAILY', 'objective_type': 'DISTANCE_TOTAL', 'target_value': 1200, 'reward_coins': 250, 'reward_gems': 2, 'icon': '🏃'},
    {'code': 'daily_score_10k', 'title': 'High Roller', 'description': 'Score 10,000 points in a single run.', 'mission_type': 'DAILY', 'objective_type': 'SCORE_SINGLE_RUN', 'target_value': 10000, 'reward_coins': 350, 'reward_gems': 3, 'icon': '⭐'},
    {'code': 'career_coins_5000', 'title': 'Banker', 'description': 'Accumulate 5,000 coins.', 'mission_type': 'REPEATABLE', 'objective_type': 'COINS_TOTAL', 'target_value': 5000, 'reward_coins': 1000, 'reward_gems': 10, 'icon': '💰'},
    {'code': 'career_powerups_15', 'title': 'Gadget Geek', 'description': 'Grab 15 power-up items.', 'mission_type': 'REPEATABLE', 'objective_type': 'POWERUPS_COLLECTED', 'target_value': 15, 'reward_coins': 500, 'reward_gems': 5, 'icon': '🧲'},
]

def seed_missions():
    for m in DEFAULT_MISSIONS:
        Mission.objects.get_or_create(
            code=m['code'],
            defaults=m
        )

def assign_user_daily_missions(user):
    seed_missions()
    today = timezone.now().date()
    missions = Mission.objects.all()
    for m in missions:
        UserMission.objects.get_or_create(
            user=user,
            mission=m,
            assigned_date=today,
            defaults={'current_value': 0}
        )

@require_GET
def get_missions_api(request):
    seed_missions()
    if not request.user.is_authenticated:
        # Return default preview missions for guests
        missions = Mission.objects.all()
        data = [{
            'id': m.id,
            'code': m.code,
            'title': m.title,
            'description': m.description,
            'mission_type': m.mission_type,
            'objective_type': m.objective_type,
            'target_value': m.target_value,
            'reward_coins': m.reward_coins,
            'reward_gems': m.reward_gems,
            'icon': m.icon,
            'current_value': 0,
            'progress_pct': 0,
            'is_completed': False,
            'is_claimed': False,
        } for m in missions]
        return JsonResponse({'status': 'success', 'missions': data})

    assign_user_daily_missions(request.user)
    today = timezone.now().date()
    user_missions = UserMission.objects.filter(
        user=request.user,
        assigned_date=today
    ).select_related('mission')

    data = []
    for um in user_missions:
        m = um.mission
        pct = min(100, int((um.current_value / m.target_value) * 100)) if m.target_value > 0 else 0
        data.append({
            'id': um.id,
            'mission_id': m.id,
            'code': m.code,
            'title': m.title,
            'description': m.description,
            'mission_type': m.mission_type,
            'objective_type': m.objective_type,
            'target_value': m.target_value,
            'reward_coins': m.reward_coins,
            'reward_gems': m.reward_gems,
            'icon': m.icon,
            'current_value': um.current_value,
            'progress_pct': pct,
            'is_completed': um.is_completed,
            'is_claimed': um.is_claimed,
        })

    return JsonResponse({'status': 'success', 'missions': data})


@require_POST
def claim_mission_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Authentication required.'}, status=401)

    try:
        payload = json.loads(request.body.decode('utf-8'))
        user_mission_id = payload.get('user_mission_id')
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid payload.'}, status=400)

    user_mission = get_object_or_404(UserMission, id=user_mission_id, user=request.user)

    if not user_mission.is_completed:
        return JsonResponse({'status': 'error', 'message': 'Mission is not yet completed.'}, status=400)

    if user_mission.is_claimed:
        return JsonResponse({'status': 'error', 'message': 'Reward already claimed.'}, status=400)

    user_mission.is_claimed = True
    user_mission.save()

    profile = get_object_or_404(PlayerProfile, user=request.user)
    profile.total_coins += user_mission.mission.reward_coins
    profile.total_gems += user_mission.mission.reward_gems
    profile.save()

    return JsonResponse({
        'status': 'success',
        'message': f"Claimed {user_mission.mission.reward_coins} coins & {user_mission.mission.reward_gems} gems!",
        'total_coins': profile.total_coins,
        'total_gems': profile.total_gems
    })
