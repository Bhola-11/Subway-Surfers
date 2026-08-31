from django.urls import path
from . import views

app_name = 'missions'

urlpatterns = [
    path('', views.get_missions_api, name='list'),
    path('claim/', views.claim_mission_api, name='claim'),
]
