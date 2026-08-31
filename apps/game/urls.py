from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/session/start/', views.start_session_api, name='start_session'),
    path('api/run/submit/', views.submit_run_api, name='submit_run'),
]
