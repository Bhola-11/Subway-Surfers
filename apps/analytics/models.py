from django.db import models
from django.contrib.auth.models import User

class DailyGameMetric(models.Model):
    date = models.DateField(unique=True)
    total_runs = models.PositiveIntegerField(default=0)
    total_distance_m = models.FloatField(default=0.0)
    total_coins_collected = models.PositiveIntegerField(default=0)
    total_active_players = models.PositiveIntegerField(default=0)
    avg_score = models.FloatField(default=0.0)

    def __str__(self):
        return f"Metrics {self.date}: {self.total_runs} runs"


class EventLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=64, blank=True)
    event_name = models.CharField(max_length=64)
    event_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.created_at}] {self.event_name}"
