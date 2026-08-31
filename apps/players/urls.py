from django.urls import path
from . import views

app_name = 'players'

urlpatterns = [
    path('profile/', views.get_profile_api, name='profile'),
    path('catalog/', views.get_shop_catalog_api, name='catalog'),
    path('unlock/', views.unlock_item_api, name='unlock'),
    path('select/', views.select_item_api, name='select'),
    path('upgrade-powerup/', views.upgrade_powerup_api, name='upgrade_powerup'),
]
