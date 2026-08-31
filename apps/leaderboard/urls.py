from django.urls import path
from . import views

app_name = 'leaderboard'

urlpatterns = [
    path('', views.get_leaderboard_api, name='list'),
]
