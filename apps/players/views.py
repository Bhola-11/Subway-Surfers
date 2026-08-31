import json
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from .models import PlayerProfile, Character, CharacterSkin, PlayerInventory

def get_or_create_guest_profile(session):
    # For guest users without auth, we manage temporary session stats or mock profile
    return {
        'nickname': 'Guest Runner',
        'is_guest': True,
        'high_score': session.get('guest_high_score', 0),
        'total_coins': session.get('guest_coins', 100),
        'total_gems': session.get('guest_gems', 2),
        'magnet_level': session.get('guest_magnet_level', 1),
        'multiplier_level': session.get('guest_multiplier_level', 1),
        'shield_level': session.get('guest_shield_level', 1),
        'jetpack_level': session.get('guest_jetpack_level', 1),
        'active_character': session.get('guest_active_character', 'dash'),
        'active_skin': session.get('guest_active_skin', 'classic-cyan'),
        'sound_enabled': session.get('sound_enabled', True),
        'music_enabled': session.get('music_enabled', True),
    }

@require_GET
def get_profile_api(request):
    if not request.user.is_authenticated:
        guest_data = get_or_create_guest_profile(request.session)
        return JsonResponse({'status': 'success', 'data': guest_data})

    profile, _ = PlayerProfile.objects.get_or_create(user=request.user)
    
    # Get unlocked character slugs
    unlocked_chars = list(PlayerInventory.objects.filter(
        player=profile, character__isnull=False
    ).values_list('character__slug', flat=True))

    unlocked_skins = list(PlayerInventory.objects.filter(
        player=profile, skin__isnull=False
    ).values_list('skin__slug', flat=True))

    data = {
        'nickname': profile.display_name,
        'is_guest': False,
        'high_score': profile.high_score,
        'total_score': profile.total_score,
        'total_distance_m': round(profile.total_distance_m, 1),
        'total_coins': profile.total_coins,
        'total_gems': profile.total_gems,
        'total_runs': profile.total_runs,
        'magnet_level': profile.magnet_level,
        'multiplier_level': profile.multiplier_level,
        'shield_level': profile.shield_level,
        'jetpack_level': profile.jetpack_level,
        'active_character': profile.active_character.slug if profile.active_character else 'dash',
        'active_skin': profile.active_skin.slug if profile.active_skin else 'classic-cyan',
        'unlocked_characters': unlocked_chars,
        'unlocked_skins': unlocked_skins,
        'sound_enabled': profile.sound_enabled,
        'music_enabled': profile.music_enabled,
    }
    return JsonResponse({'status': 'success', 'data': data})


@require_GET
def get_shop_catalog_api(request):
    characters = Character.objects.all().prefetch_related('skins')
    
    unlocked_char_ids = set()
    unlocked_skin_ids = set()

    if request.user.is_authenticated:
        profile = getattr(request.user, 'player_profile', None)
        if profile:
            unlocked_char_ids = set(PlayerInventory.objects.filter(
                player=profile, character__isnull=False
            ).values_list('character_id', flat=True))
            unlocked_skin_ids = set(PlayerInventory.objects.filter(
                player=profile, skin__isnull=False
            ).values_list('skin_id', flat=True))

    catalog = []
    for c in characters:
        skins_data = []
        for s in c.skins.all():
            skins_data.append({
                'id': s.id,
                'name': s.name,
                'slug': s.slug,
                'body_color': s.body_color,
                'cloth_color': s.cloth_color,
                'shoes_color': s.shoes_color,
                'glow_color': s.glow_color,
                'cost_coins': s.unlock_cost_coins,
                'is_unlocked': s.is_default or (s.id in unlocked_skin_ids)
            })

        catalog.append({
            'id': c.id,
            'name': c.name,
            'slug': c.slug,
            'description': c.description,
            'avatar_emoji': c.avatar_emoji,
            'primary_color': c.primary_color,
            'secondary_color': c.secondary_color,
            'accent_color': c.accent_color,
            'bonus_multiplier': c.bonus_multiplier,
            'bonus_coin_chance': c.bonus_coin_chance,
            'cost_coins': c.unlock_cost_coins,
            'cost_gems': c.unlock_cost_gems,
            'is_unlocked': c.is_default or (c.id in unlocked_char_ids),
            'skins': skins_data
        })

    powerup_upgrades = [
        {'type': 'magnet', 'name': 'Coin Magnet', 'icon': '🧲', 'cost': 500, 'description': '+3s duration per level'},
        {'type': 'multiplier', 'name': '2x Multiplier', 'icon': '✖️', 'cost': 600, 'description': '+3s duration per level'},
        {'type': 'shield', 'name': 'Energy Shield', 'icon': '🛡️', 'cost': 800, 'description': 'Extra protective barrier'},
        {'type': 'jetpack', 'name': 'Rocket Jetpack', 'icon': '🚀', 'cost': 1000, 'description': '+4s flight duration per level'},
    ]

    return JsonResponse({
        'status': 'success',
        'characters': catalog,
        'powerups': powerup_upgrades
    })


@require_POST
def unlock_item_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Please login to unlock characters and skins.'}, status=401)

    profile = get_object_or_404(PlayerProfile, user=request.user)
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid payload.'}, status=400)

    item_type = payload.get('type')  # 'character' or 'skin'
    item_id = payload.get('id')

    if item_type == 'character':
        character = get_object_or_404(Character, id=item_id)
        if PlayerInventory.objects.filter(player=profile, character=character).exists():
            return JsonResponse({'status': 'error', 'message': 'Character already unlocked.'})

        if profile.total_coins < character.unlock_cost_coins or profile.total_gems < character.unlock_cost_gems:
            return JsonResponse({'status': 'error', 'message': 'Insufficient coins or gems.'})

        profile.total_coins -= character.unlock_cost_coins
        profile.total_gems -= character.unlock_cost_gems
        profile.save()

        PlayerInventory.objects.create(player=profile, character=character)
        return JsonResponse({'status': 'success', 'message': f'Unlocked {character.name}!'})

    elif item_type == 'skin':
        skin = get_object_or_404(CharacterSkin, id=item_id)
        if PlayerInventory.objects.filter(player=profile, skin=skin).exists():
            return JsonResponse({'status': 'error', 'message': 'Skin already unlocked.'})

        if profile.total_coins < skin.unlock_cost_coins:
            return JsonResponse({'status': 'error', 'message': 'Insufficient coins.'})

        profile.total_coins -= skin.unlock_cost_coins
        profile.save()

        PlayerInventory.objects.create(player=profile, skin=skin)
        return JsonResponse({'status': 'success', 'message': f'Unlocked {skin.name}!'})

    return JsonResponse({'status': 'error', 'message': 'Invalid item type.'}, status=400)


@require_POST
def select_item_api(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid payload.'}, status=400)

    char_slug = payload.get('character_slug')
    skin_slug = payload.get('skin_slug')

    if not request.user.is_authenticated:
        if char_slug:
            request.session['guest_active_character'] = char_slug
        if skin_slug:
            request.session['guest_active_skin'] = skin_slug
        return JsonResponse({'status': 'success', 'message': 'Active character updated.'})

    profile = get_object_or_404(PlayerProfile, user=request.user)

    if char_slug:
        char = get_object_or_404(Character, slug=char_slug)
        # Check ownership
        if not char.is_default and not PlayerInventory.objects.filter(player=profile, character=char).exists():
            return JsonResponse({'status': 'error', 'message': 'Character not owned.'}, status=403)
        profile.active_character = char

    if skin_slug:
        skin = get_object_or_404(CharacterSkin, slug=skin_slug)
        if not skin.is_default and not PlayerInventory.objects.filter(player=profile, skin=skin).exists():
            return JsonResponse({'status': 'error', 'message': 'Skin not owned.'}, status=403)
        profile.active_skin = skin

    profile.save()
    return JsonResponse({'status': 'success', 'message': 'Equipment updated.'})


@require_POST
def upgrade_powerup_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Login to upgrade powerups.'}, status=401)

    profile = get_object_or_404(PlayerProfile, user=request.user)
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid payload.'}, status=400)

    powerup_type = payload.get('type')
    costs = {
        'magnet': 500 * profile.magnet_level,
        'multiplier': 600 * profile.multiplier_level,
        'shield': 800 * profile.shield_level,
        'jetpack': 1000 * profile.jetpack_level,
    }

    cost = costs.get(powerup_type)
    if cost is None:
        return JsonResponse({'status': 'error', 'message': 'Invalid powerup type.'}, status=400)

    if profile.total_coins < cost:
        return JsonResponse({'status': 'error', 'message': 'Insufficient coins for upgrade.'})

    profile.total_coins -= cost
    if powerup_type == 'magnet':
        profile.magnet_level += 1
    elif powerup_type == 'multiplier':
        profile.multiplier_level += 1
    elif powerup_type == 'shield':
        profile.shield_level += 1
    elif powerup_type == 'jetpack':
        profile.jetpack_level += 1

    profile.save()
    return JsonResponse({
        'status': 'success',
        'message': f'Upgraded {powerup_type.capitalize()}!',
        'new_level': getattr(profile, f'{powerup_type}_level'),
        'remaining_coins': profile.total_coins
    })
