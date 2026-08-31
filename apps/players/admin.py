from django.contrib import admin
from .models import Character, CharacterSkin, PlayerProfile, PlayerInventory

class CharacterSkinInline(admin.TabularInline):
    model = CharacterSkin
    extra = 1

@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ('name', 'avatar_emoji', 'bonus_multiplier', 'unlock_cost_coins', 'unlock_cost_gems', 'is_default')
    inlines = [CharacterSkinInline]

@admin.register(CharacterSkin)
class CharacterSkinAdmin(admin.ModelAdmin):
    list_display = ('character', 'name', 'unlock_cost_coins', 'is_default')

@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'nickname', 'high_score', 'total_coins', 'total_gems', 'total_runs')
    search_fields = ('user__username', 'nickname')

@admin.register(PlayerInventory)
class PlayerInventoryAdmin(admin.ModelAdmin):
    list_display = ('player', 'character', 'skin', 'unlocked_at')
