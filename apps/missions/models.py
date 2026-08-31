from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Mission(models.Model):
    MISSION_TYPES = [
        ('DAILY', 'Daily Challenge'),
        ('REPEATABLE', 'Career Mission'),
    ]

    OBJECTIVE_TYPES = [
        ('COINS_SINGLE_RUN', 'Collect Coins in One Run'),
        ('COINS_TOTAL', 'Collect Total Coins'),
        ('DISTANCE_SINGLE_RUN', 'Reach Distance in One Run'),
        ('DISTANCE_TOTAL', 'Reach Total Distance'),
        ('SCORE_SINGLE_RUN', 'Score Points in One Run'),
        ('POWERUPS_COLLECTED', 'Collect Powerups'),
        ('TRAINS_DODGED', 'Dodge Moving Trains'),
    ]

    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    mission_type = models.CharField(max_length=20, choices=MISSION_TYPES, default='DAILY')
    objective_type = models.CharField(max_length=30, choices=OBJECTIVE_TYPES)
    target_value = models.BigIntegerField(default=100)
    reward_coins = models.PositiveIntegerField(default=150)
    reward_gems = models.PositiveIntegerField(default=1)
    icon = models.CharField(max_length=20, default='🎯')

    def __str__(self):
        return f"[{self.mission_type}] {self.title} ({self.target_value})"


class UserMission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='missions')
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name='user_missions')
    current_value = models.BigIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    is_claimed = models.BooleanField(default=False)
    assigned_date = models.DateField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'mission', 'assigned_date')

    def __str__(self):
        return f"{self.user.username} - {self.mission.title} ({self.current_value}/{self.mission.target_value})"
