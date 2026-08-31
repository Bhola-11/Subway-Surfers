from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from apps.missions.models import Mission, UserMission

class MissionsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='mission_user', password='Password123!')
        self.client = Client()
        self.client.login(username='mission_user', password='Password123!')

    def test_get_and_claim_mission(self):
        # 1. Fetch missions
        res = self.client.get(reverse('missions:list'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue(len(data['missions']) > 0)

        # 2. Complete mission
        um = UserMission.objects.filter(user=self.user).first()
        um.is_completed = True
        um.save()

        # 3. Claim reward
        claim_res = self.client.post(
            reverse('missions:claim'),
            data={'user_mission_id': um.id},
            content_type='application/json'
        )
        self.assertEqual(claim_res.status_code, 200)
        claim_data = claim_res.json()
        self.assertEqual(claim_data['status'], 'success')
