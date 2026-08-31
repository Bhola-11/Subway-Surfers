from django.core.management.base import BaseCommand
from apps.players.models import Character, CharacterSkin
from apps.achievements.views import seed_achievements
from apps.missions.views import seed_missions

class Command(BaseCommand):
    help = 'Seeds characters, skins, achievements, and missions'

    def handle(self, *args, **options):
        # 1. Dash
        c1, _ = Character.objects.get_or_create(
            slug='dash',
            defaults={
                'name': 'Dash',
                'description': 'Agile subway prodigy with balanced speed and reflexes.',
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
        CharacterSkin.objects.get_or_create(
            character=c1, slug='classic-cyan',
            defaults={'name': 'Classic Cyan', 'body_color': '#22d3ee', 'cloth_color': '#0369a1', 'shoes_color': '#fbbf24', 'glow_color': '#38bdf8', 'unlock_cost_coins': 0, 'is_default': True}
        )
        CharacterSkin.objects.get_or_create(
            character=c1, slug='neon-volt',
            defaults={'name': 'Neon Volt', 'body_color': '#10b981', 'cloth_color': '#064e3b', 'shoes_color': '#facc15', 'glow_color': '#34d399', 'unlock_cost_coins': 400, 'is_default': False}
        )

        # 2. Blaze
        c2, _ = Character.objects.get_or_create(
            slug='blaze',
            defaults={
                'name': 'Blaze',
                'description': 'Adrenaline junkie equipped with flame boosters.',
                'avatar_emoji': '🔥',
                'primary_color': '#ff416c',
                'secondary_color': '#ff4b2b',
                'accent_color': '#f59e0b',
                'bonus_multiplier': 1.25,
                'bonus_coin_chance': 0.10,
                'unlock_cost_coins': 1200,
                'unlock_cost_gems': 5,
                'is_default': False,
                'order': 2
            }
        )
        CharacterSkin.objects.get_or_create(
            character=c2, slug='inferno-red',
            defaults={'name': 'Inferno Red', 'body_color': '#ef4444', 'cloth_color': '#7f1d1d', 'shoes_color': '#f97316', 'glow_color': '#f87171', 'unlock_cost_coins': 0, 'is_default': True}
        )
        CharacterSkin.objects.get_or_create(
            character=c2, slug='magma-surge',
            defaults={'name': 'Magma Surge', 'body_color': '#ea580c', 'cloth_color': '#431407', 'shoes_color': '#eab308', 'glow_color': '#fb923c', 'unlock_cost_coins': 600, 'is_default': False}
        )

        # 3. CyberNinja
        c3, _ = Character.objects.get_or_create(
            slug='cyber-ninja',
            defaults={
                'name': 'Cyber Ninja',
                'description': 'Stealthy rogue capable of hyper-speed rail jumps.',
                'avatar_emoji': '🥷',
                'primary_color': '#a855f7',
                'secondary_color': '#6366f1',
                'accent_color': '#ec4899',
                'bonus_multiplier': 1.5,
                'bonus_coin_chance': 0.15,
                'unlock_cost_coins': 3000,
                'unlock_cost_gems': 15,
                'is_default': False,
                'order': 3
            }
        )
        CharacterSkin.objects.get_or_create(
            character=c3, slug='shadow-violet',
            defaults={'name': 'Shadow Violet', 'body_color': '#8b5cf6', 'cloth_color': '#2e1065', 'shoes_color': '#d946ef', 'glow_color': '#c084fc', 'unlock_cost_coins': 0, 'is_default': True}
        )
        CharacterSkin.objects.get_or_create(
            character=c3, slug='phantom-stealth',
            defaults={'name': 'Phantom Stealth', 'body_color': '#64748b', 'cloth_color': '#0f172a', 'shoes_color': '#06b6d4', 'glow_color': '#94a3b8', 'unlock_cost_coins': 900, 'is_default': False}
        )

        # 4. Roxy
        c4, _ = Character.objects.get_or_create(
            slug='roxy-gold',
            defaults={
                'name': 'Roxy Gold',
                'description': 'High-society graffiti artist with 2x magnet pull power.',
                'avatar_emoji': '👑',
                'primary_color': '#f59e0b',
                'secondary_color': '#d97706',
                'accent_color': '#fbbf24',
                'bonus_multiplier': 2.0,
                'bonus_coin_chance': 0.25,
                'unlock_cost_coins': 6500,
                'unlock_cost_gems': 30,
                'is_default': False,
                'order': 4
            }
        )
        CharacterSkin.objects.get_or_create(
            character=c4, slug='royal-gold',
            defaults={'name': 'Royal Gold', 'body_color': '#eab308', 'cloth_color': '#713f12', 'shoes_color': '#fef08a', 'glow_color': '#fde047', 'unlock_cost_coins': 0, 'is_default': True}
        )

        # Achievements & Missions
        seed_achievements()
        seed_missions()

        self.stdout.write(self.style.SUCCESS("Successfully seeded all characters, skins, achievements, and missions!"))
