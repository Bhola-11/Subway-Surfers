from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse

class AccountsTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_user_registration(self):
        response = self.client.post(reverse('accounts:register'), {
            'username': 'speedrunner_test',
            'email': 'runner@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!'
        })
        self.assertEqual(response.status_code, 302)
        user = User.objects.get(username='speedrunner_test')
        self.assertIsNotNone(user)
        self.assertIsNotNone(user.player_profile)
        self.assertEqual(user.player_profile.total_coins, 250)

    def test_user_login_logout(self):
        User.objects.create_user(username='runner_bob', password='Password123!')
        login_res = self.client.post(reverse('accounts:login'), {
            'username': 'runner_bob',
            'password': 'Password123!'
        })
        self.assertEqual(login_res.status_code, 302)

        logout_res = self.client.get(reverse('accounts:logout'))
        self.assertEqual(logout_res.status_code, 302)
