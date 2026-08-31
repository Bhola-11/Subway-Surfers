from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/players/', include('apps.players.urls', namespace='players')),
    path('api/leaderboard/', include('apps.leaderboard.urls', namespace='leaderboard')),
    path('api/achievements/', include('apps.achievements.urls', namespace='achievements')),
    path('api/missions/', include('apps.missions.urls', namespace='missions')),
    path('api/analytics/', include('apps.analytics.urls', namespace='analytics')),
    path('', include('apps.game.urls', namespace='game')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
