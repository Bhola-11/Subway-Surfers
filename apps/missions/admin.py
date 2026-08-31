from django.contrib import admin
from .models import Mission, UserMission

@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'mission_type', 'objective_type', 'target_value', 'reward_coins', 'reward_gems')

@admin.register(UserMission)
class UserMissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'mission', 'current_value', 'is_completed', 'is_claimed', 'assigned_date')
