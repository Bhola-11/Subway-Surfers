from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from apps.players.models import PlayerProfile, Character, CharacterSkin, PlayerInventory

@receiver(post_save, sender=User)
def create_user_player_profile(sender, instance, created, **kwargs):
    if created:
        # Ensure default character exists
        default_char, _ = Character.objects.get_or_create(
            slug='dash',
            defaults={
                'name': 'Dash',
                'description': 'The agile street runner with lightning reflexes.',
                'avatar_emoji': '⚡',
                'primary_color': '#00f2fe',
                'secondary_color': '#4facfe',
                'accent_color': '#f59e0b',
                'bonus_multiplier': 1.0,
                'bonus_coin_chance': 0.05,
                'unlock_cost_coins': 0,
                'unlock_cost_gems': 0,
                'is_default': True,
                'order': 1
            }
        )

        default_skin, _ = CharacterSkin.objects.get_or_create(
            character=default_char,
            slug='classic-cyan',
            defaults={
                'name': 'Classic Cyan',
                'body_color': '#22d3ee',
                'cloth_color': '#0369a1',
                'shoes_color': '#fbbf24',
                'glow_color': '#38bdf8',
                'unlock_cost_coins': 0,
                'is_default': True,
            }
        )

        profile = PlayerProfile.objects.create(
            user=instance,
            nickname=instance.username,
            active_character=default_char,
            active_skin=default_skin,
            total_coins=250,
            total_gems=10
        )

        PlayerInventory.objects.create(player=profile, character=default_char)
        PlayerInventory.objects.create(player=profile, skin=default_skin)
