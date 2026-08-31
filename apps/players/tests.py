from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from apps.players.models import Character, CharacterSkin, PlayerProfile, PlayerInventory

class PlayersAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='shop_tester', password='Password123!')
        self.client = Client()
        self.client.login(username='shop_tester', password='Password123!')
        
        self.char = Character.objects.create(
            name='Test Hero',
            slug='test-hero',
            unlock_cost_coins=200,
            unlock_cost_gems=0,
            is_default=False
        )

    def test_get_profile_api(self):
        res = self.client.get(reverse('players:profile'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['nickname'], 'shop_tester')

    def test_unlock_character_and_select(self):
        # User starts with 250 coins
        unlock_res = self.client.post(
            reverse('players:unlock'),
            data={'type': 'character', 'id': self.char.id},
            content_type='application/json'
        )
        self.assertEqual(unlock_res.status_code, 200)
        self.assertEqual(unlock_res.json()['status'], 'success')

        profile = PlayerProfile.objects.get(user=self.user)
        self.assertEqual(profile.total_coins, 50) # 250 - 200 = 50

        # Select unlocked character
        select_res = self.client.post(
            reverse('players:select'),
            data={'character_slug': 'test-hero'},
            content_type='application/json'
        )
        self.assertEqual(select_res.status_code, 200)
        profile.refresh_from_db()
        self.assertEqual(profile.active_character, self.char)
