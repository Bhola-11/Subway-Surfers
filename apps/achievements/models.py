from django.db import models
from django.contrib.auth.models import User

class Achievement(models.Model):
    CATEGORY_CHOICES = [
        ('SCORE', 'Score Milestone'),
        ('DISTANCE', 'Distance Runner'),
        ('COINS', 'Coin Collector'),
        ('POWERUPS', 'Powerup Mastery'),
        ('RUNS', 'Dedicated Runner'),
        ('SKILLS', 'Trick & Dodge'),
    ]

    code = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=20, default='🏆')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='SCORE')
    target_value = models.BigIntegerField(default=1000)
    reward_coins = models.PositiveIntegerField(default=100)
    reward_gems = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'target_value']

    def __str__(self):
        return f"{self.icon} {self.name} ({self.target_value})"


class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='user_progress')
    current_progress = models.BigIntegerField(default=0)
    is_unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)
    is_claimed = models.BooleanField(default=False)
    claimed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'achievement')

    def __str__(self):
        status = "CLAIMED" if self.is_claimed else ("UNLOCKED" if self.is_unlocked else f"{self.current_progress}/{self.achievement.target_value}")
        return f"{self.user.username} - {self.achievement.name} [{status}]"
