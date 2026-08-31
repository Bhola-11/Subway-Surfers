from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('log-event/', views.log_event_api, name='log_event'),
]
