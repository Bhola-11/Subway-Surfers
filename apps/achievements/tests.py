from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from apps.achievements.models import Achievement, UserAchievement

class AchievementsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='ach_user', password='Password123!')
        self.client = Client()
        self.client.login(username='ach_user', password='Password123!')

    def test_get_and_claim_achievement(self):
        # 1. Fetch achievements
        res = self.client.get(reverse('achievements:list'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue(len(data['achievements']) > 0)

        # 2. Simulate unlocked achievement
        ach = Achievement.objects.first()
        ua, _ = UserAchievement.objects.get_or_create(user=self.user, achievement=ach)
        ua.is_unlocked = True
        ua.save()

        # 3. Claim reward
        claim_res = self.client.post(
            reverse('achievements:claim'),
            data={'achievement_id': ach.id},
            content_type='application/json'
        )
        self.assertEqual(claim_res.status_code, 200)
        claim_data = claim_res.json()
        self.assertEqual(claim_data['status'], 'success')
