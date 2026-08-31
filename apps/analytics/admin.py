from django.contrib import admin
from .models import DailyGameMetric, EventLog

@admin.register(DailyGameMetric)
class DailyGameMetricAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_runs', 'total_distance_m', 'total_coins_collected', 'avg_score')

@admin.register(EventLog)
class EventLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'event_name', 'session_id')
    list_filter = ('event_name',)
