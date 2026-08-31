from django.db import models
from django.contrib.auth.models import User

class LeaderboardRecord(models.Model):
    TIMEFRAMES = [
        ('ALL_TIME', 'All-Time'),
        ('WEEKLY', 'Weekly'),
        ('DAILY', 'Daily'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaderboard_records')
    score = models.BigIntegerField(default=0)
    distance_m = models.FloatField(default=0.0)
    coins = models.PositiveIntegerField(default=0)
    character_used = models.CharField(max_length=50, default='dash')
    timeframe = models.CharField(max_length=20, choices=TIMEFRAMES, default='ALL_TIME')
    period_key = models.CharField(max_length=50, default='all')  # e.g., '2026-W35', '2026-08-31'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['timeframe', 'period_key', '-score']),
        ]
        unique_together = ('user', 'timeframe', 'period_key')

    def __str__(self):
        return f"[{self.timeframe}] {self.user.username}: {self.score}"
