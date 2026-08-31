from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET
from .models import LeaderboardRecord
from apps.players.models import PlayerProfile

@require_GET
def get_leaderboard_api(request):
    timeframe = request.GET.get('timeframe', 'ALL_TIME').upper()
    if timeframe not in ['ALL_TIME', 'WEEKLY', 'DAILY']:
        timeframe = 'ALL_TIME'

    now = timezone.now()
    if timeframe == 'DAILY':
        period_key = now.strftime('%Y-%m-%d')
    elif timeframe == 'WEEKLY':
        period_key = f"{now.year}-W{now.isocalendar()[1]}"
    else:
        period_key = 'all'

    records = LeaderboardRecord.objects.filter(
        timeframe=timeframe,
        period_key=period_key
    ).select_related('user', 'user__player_profile').order_by('-score')[:50]

    leaderboard = []
    current_user_rank = None

    for idx, rec in enumerate(records, start=1):
        prof = getattr(rec.user, 'player_profile', None)
        nickname = prof.nickname if prof and prof.nickname else rec.user.username
        avatar_emoji = prof.active_character.avatar_emoji if prof and prof.active_character else '🏃'
        
        is_current_user = (request.user.is_authenticated and rec.user_id == request.user.id)
        if is_current_user:
            current_user_rank = idx

        leaderboard.append({
            'rank': idx,
            'username': nickname,
            'score': rec.score,
            'distance_m': round(rec.distance_m, 1),
            'coins': rec.coins,
            'character': rec.character_used,
            'avatar_emoji': avatar_emoji,
            'is_current_user': is_current_user
        })

    # If empty, add mock top runner bots for exciting arcade leaderboard feel
    if len(leaderboard) == 0:
        default_bots = [
            {'rank': 1, 'username': 'CyberSprinter_99', 'score': 158420, 'distance_m': 14200.5, 'coins': 3420, 'character': 'dash', 'avatar_emoji': '⚡', 'is_current_user': False},
            {'rank': 2, 'username': 'NeonValkyrie', 'score': 124800, 'distance_m': 11800.0, 'coins': 2890, 'character': 'dash', 'avatar_emoji': '🔥', 'is_current_user': False},
            {'rank': 3, 'username': 'MetroMaster_X', 'score': 98600, 'distance_m': 8950.2, 'coins': 1950, 'character': 'dash', 'avatar_emoji': '👑', 'is_current_user': False},
            {'rank': 4, 'username': 'RailSurfer_007', 'score': 67400, 'distance_m': 6400.0, 'coins': 1240, 'character': 'dash', 'avatar_emoji': '🕶️', 'is_current_user': False},
            {'rank': 5, 'username': 'SpeedPhantom', 'score': 45100, 'distance_m': 4300.8, 'coins': 880, 'character': 'dash', 'avatar_emoji': '🚀', 'is_current_user': False},
        ]
        leaderboard = default_bots

    return JsonResponse({
        'status': 'success',
        'timeframe': timeframe,
        'period_key': period_key,
        'leaderboard': leaderboard,
        'user_rank': current_user_rank
    })
