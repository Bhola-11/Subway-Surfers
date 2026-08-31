from django.contrib import admin
from .models import LeaderboardRecord

@admin.register(LeaderboardRecord)
class LeaderboardRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'timeframe', 'period_key', 'score', 'distance_m', 'coins')
    list_filter = ('timeframe', 'period_key')
    search_fields = ('user__username',)
