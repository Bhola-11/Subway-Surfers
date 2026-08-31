import uuid
from django.db import models
from django.contrib.auth.models import User

class GameSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='game_sessions')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        user_repr = self.user.username if self.user else "Guest"
        return f"Session {self.id} ({user_repr})"


class GameRun(models.Model):
    DEATH_CAUSES = [
        ('TRAIN_COLLISION', 'Train Collision'),
        ('BARRIER_COLLISION', 'Barrier Collision'),
        ('OBSTACLE_COLLISION', 'Obstacle Collision'),
        ('FALL_OFF_TRACK', 'Fall Off Track'),
        ('FORFEIT', 'Forfeit / Exit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='runs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='runs')
    
    score = models.BigIntegerField(default=0)
    distance_m = models.FloatField(default=0.0)
    coins_collected = models.PositiveIntegerField(default=0)
    max_multiplier = models.FloatField(default=1.0)
    duration_seconds = models.FloatField(default=0.0)
    powerups_used_count = models.PositiveIntegerField(default=0)
    death_cause = models.CharField(max_length=30, choices=DEATH_CAUSES, default='OBSTACLE_COLLISION')
    
    character_used = models.CharField(max_length=50, default='dash')
    skin_used = models.CharField(max_length=50, default='classic-cyan')
    
    is_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-created_at']

    def __str__(self):
        user_repr = self.user.username if self.user else "Guest"
        return f"Run {self.id} | Score: {self.score} | Coins: {self.coins_collected} ({user_repr})"


class RunTelemetry(models.Model):
    run = models.ForeignKey(GameRun, on_delete=models.CASCADE, related_name='telemetry')
    timestamp_sec = models.FloatField()
    event_type = models.CharField(max_length=50)  # 'POWERUP_COLLECT', 'JUMP', 'SLIDE', 'LANE_CHANGE', 'NEAR_MISS'
    lane = models.IntegerField(default=0)  # -1 (left), 0 (mid), 1 (right)
    speed = models.FloatField(default=0.0)
    data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Telemetry {self.event_type} at {self.timestamp_sec}s"
