from django.urls import path
from . import views

app_name = 'achievements'

urlpatterns = [
    path('', views.get_achievements_api, name='list'),
    path('claim/', views.claim_achievement_api, name='claim'),
]
