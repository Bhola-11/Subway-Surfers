from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from apps.game.models import GameSession, GameRun
from apps.players.models import PlayerProfile

class GameTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='game_tester', password='Password123!')
        self.client = Client()
        self.client.login(username='game_tester', password='Password123!')

    def test_start_session_api(self):
        res = self.client.post(reverse('game:start_session'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue('session_id' in data)

    def test_submit_run_api(self):
        session_res = self.client.post(reverse('game:start_session'))
        session_id = session_res.json()['session_id']

        run_payload = {
            'session_id': session_id,
            'score': 1500,
            'distance_m': 300.5,
            'coins': 45,
            'duration_sec': 25.0,
            'max_multiplier': 2.0,
            'powerups_used': 2,
            'death_cause': 'TRAIN_COLLISION',
            'character_used': 'dash',
            'skin_used': 'classic-cyan',
            'telemetry': [{'t': 1.5, 'event': 'JUMP', 'lane': 0, 'speed': 380}]
        }

        submit_res = self.client.post(
            reverse('game:submit_run'),
            data=run_payload,
            content_type='application/json'
        )
        self.assertEqual(submit_res.status_code, 200)
        data = submit_res.json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue(data['data']['is_valid'])
        self.assertTrue(data['data']['new_high_score'])

        # Verify profile updated
        profile = PlayerProfile.objects.get(user=self.user)
        self.assertEqual(profile.high_score, 1500)
        self.assertEqual(profile.total_coins, 250 + 45)
