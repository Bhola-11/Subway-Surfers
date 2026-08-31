from django.contrib import admin
from .models import GameSession, GameRun, RunTelemetry

class RunTelemetryInline(admin.TabularInline):
    model = RunTelemetry
    extra = 0
    readonly_fields = ('timestamp_sec', 'event_type', 'lane', 'speed', 'data')

@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'is_active', 'created_at', 'ended_at')
    search_fields = ('id', 'user__username', 'ip_address')

@admin.register(GameRun)
class GameRunAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'score', 'distance_m', 'coins_collected', 'max_multiplier', 'death_cause', 'is_valid', 'created_at')
    list_filter = ('is_valid', 'death_cause', 'created_at')
    search_fields = ('id', 'user__username')
    inlines = [RunTelemetryInline]
