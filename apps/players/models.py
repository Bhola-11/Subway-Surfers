from django.db import models
from django.contrib.auth.models import User

class Character(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    avatar_emoji = models.CharField(max_length=10, default="🏃")
    primary_color = models.CharField(max_length=20, default="#00f2fe")
    secondary_color = models.CharField(max_length=20, default="#4facfe")
    accent_color = models.CharField(max_length=20, default="#ff007f")
    bonus_multiplier = models.FloatField(default=1.0)
    bonus_coin_chance = models.FloatField(default=0.0)
    unlock_cost_coins = models.PositiveIntegerField(default=0)
    unlock_cost_gems = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'unlock_cost_coins']

    def __str__(self):
        return self.name


class CharacterSkin(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='skins')
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50)
    body_color = models.CharField(max_length=20, default="#22d3ee")
    cloth_color = models.CharField(max_length=20, default="#0284c7")
    shoes_color = models.CharField(max_length=20, default="#f59e0b")
    glow_color = models.CharField(max_length=20, default="#38bdf8")
    unlock_cost_coins = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)

    class Meta:
        unique_together = ('character', 'slug')

    def __str__(self):
        return f"{self.character.name} - {self.name}"


class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='player_profile')
    nickname = models.CharField(max_length=50, blank=True)
    high_score = models.BigIntegerField(default=0)
    total_score = models.BigIntegerField(default=0)
    total_distance_m = models.FloatField(default=0.0)
    total_coins = models.PositiveIntegerField(default=100)  # Starting bonus
    total_gems = models.PositiveIntegerField(default=5)
    total_runs = models.PositiveIntegerField(default=0)
    
    # Power-up levels (upgradable in shop)
    magnet_level = models.PositiveIntegerField(default=1)      # Duration
    multiplier_level = models.PositiveIntegerField(default=1)  # Duration
    shield_level = models.PositiveIntegerField(default=1)      # Count
    jetpack_level = models.PositiveIntegerField(default=1)     # Duration

    active_character = models.ForeignKey(Character, on_delete=models.SET_NULL, null=True, blank=True)
    active_skin = models.ForeignKey(CharacterSkin, on_delete=models.SET_NULL, null=True, blank=True)
    
    sound_enabled = models.BooleanField(default=True)
    music_enabled = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nickname or self.user.username} (High Score: {self.high_score})"

    @property
    def display_name(self):
        return self.nickname or self.user.username


class PlayerInventory(models.Model):
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='inventory')
    character = models.ForeignKey(Character, on_delete=models.CASCADE, null=True, blank=True)
    skin = models.ForeignKey(CharacterSkin, on_delete=models.CASCADE, null=True, blank=True)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Player Inventories"

    def __str__(self):
        item = self.skin.name if self.skin else (self.character.name if self.character else 'Unknown')
        return f"{self.player.display_name} owns {item}"
