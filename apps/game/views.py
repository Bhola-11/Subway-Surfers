import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from .models import GameSession, GameRun
from .services import GameRunService
from apps.players.models import PlayerProfile, Character, CharacterSkin

@ensure_csrf_cookie
def index_view(request):
    user = request.user
    context = {
        'is_authenticated': user.is_authenticated,
        'username': user.username if user.is_authenticated else 'Guest',
    }

    if user.is_authenticated:
        profile, _ = PlayerProfile.objects.get_or_create(user=user)
        context.update({
            'high_score': profile.high_score,
            'total_coins': profile.total_coins,
            'total_gems': profile.total_gems,
            'total_runs': profile.total_runs,
            'active_character': profile.active_character.slug if profile.active_character else 'dash',
            'active_skin': profile.active_skin.slug if profile.active_skin else 'classic-cyan',
            'magnet_level': profile.magnet_level,
            'multiplier_level': profile.multiplier_level,
            'shield_level': profile.shield_level,
            'jetpack_level': profile.jetpack_level,
        })
    else:
        context.update({
            'high_score': request.session.get('guest_high_score', 0),
            'total_coins': request.session.get('guest_coins', 100),
            'total_gems': request.session.get('guest_gems', 2),
            'total_runs': request.session.get('guest_runs', 0),
            'active_character': request.session.get('guest_active_character', 'dash'),
            'active_skin': request.session.get('guest_active_skin', 'classic-cyan'),
            'magnet_level': 1,
            'multiplier_level': 1,
            'shield_level': 1,
            'jetpack_level': 1,
        })

    return render(request, 'game/index.html', context)


@require_POST
def start_session_api(request):
    ip = request.META.get('REMOTE_ADDR')
    ua = request.META.get('HTTP_USER_AGENT', '')

    session = GameSession.objects.create(
        user=request.user if request.user.is_authenticated else None,
        ip_address=ip,
        user_agent=ua[:500],
        is_active=True
    )
    request.session['game_session_id'] = str(session.id)
    return JsonResponse({
        'status': 'success',
        'session_id': str(session.id)
    })


@require_POST
def submit_run_api(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON.'}, status=400)

    session_id = payload.get('session_id') or request.session.get('game_session_id')
    try:
        session = GameSession.objects.get(id=session_id)
    except Exception:
        session = GameSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            is_active=True
        )

    result = GameRunService.process_run_submission(session, request.user, payload)

    # Handle guest state in session if unauthenticated
    if not request.user.is_authenticated:
        score = int(payload.get('score', 0))
        coins = int(payload.get('coins', 0))
        cur_high = request.session.get('guest_high_score', 0)
        if score > cur_high:
            request.session['guest_high_score'] = score
            result['new_high_score'] = True
        
        request.session['guest_coins'] = request.session.get('guest_coins', 100) + coins
        request.session['guest_runs'] = request.session.get('guest_runs', 0) + 1
        result['profile'] = {
            'high_score': request.session['guest_high_score'],
            'total_coins': request.session['guest_coins'],
            'total_gems': request.session.get('guest_gems', 2),
            'total_runs': request.session['guest_runs'],
            'total_distance_m': payload.get('distance_m', 0.0)
        }

    return JsonResponse({
        'status': 'success',
        'data': result
    })
