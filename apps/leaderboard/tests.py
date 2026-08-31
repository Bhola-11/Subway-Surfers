from django.test import TestCase, Client
from django.urls import reverse

class LeaderboardTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_get_leaderboard(self):
        res = self.client.get(reverse('leaderboard:list') + '?timeframe=ALL_TIME')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue(len(data['leaderboard']) > 0)
