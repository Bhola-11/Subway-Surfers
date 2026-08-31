import hashlib
from django.utils import timezone
from apps.players.models import PlayerProfile
from apps.leaderboard.models import LeaderboardRecord
from apps.achievements.models import Achievement, UserAchievement
from apps.achievements.views import seed_achievements
from apps.missions.models import Mission, UserMission
from apps.missions.views import assign_user_daily_missions
from .models import GameSession, GameRun, RunTelemetry

class GameRunService:
    @staticmethod
    def validate_run(score, distance, coins, duration_sec):
        """Anti-cheat verification heuristic."""
        if score < 0 or distance < 0 or coins < 0 or duration_sec <= 0:
            return False
        
        # Max reasonable speed is ~50 m/s
        if (distance / duration_sec) > 60.0:
            return False
        
        # Coins cannot exceed reasonable density per meter (e.g., 2 coins per meter)
        if distance > 10 and (coins / distance) > 3.0:
            return False
            
        return True

    @classmethod
    def process_run_submission(cls, session, user, payload):
        score = int(payload.get('score', 0))
        distance = float(payload.get('distance_m', 0.0))
        coins = int(payload.get('coins', 0))
        duration_sec = float(payload.get('duration_sec', 1.0))
        max_multiplier = float(payload.get('max_multiplier', 1.0))
        powerups_used = int(payload.get('powerups_used', 0))
        death_cause = payload.get('death_cause', 'OBSTACLE_COLLISION')
        character_used = payload.get('character_used', 'dash')
        skin_used = payload.get('skin_used', 'classic-cyan')
        telemetry_events = payload.get('telemetry', [])

        is_valid = cls.validate_run(score, distance, coins, duration_sec)

        # Create Run record
        game_run = GameRun.objects.create(
            session=session,
            user=user if (user and user.is_authenticated) else None,
            score=score,
            distance_m=distance,
            coins_collected=coins,
            max_multiplier=max_multiplier,
            duration_seconds=duration_sec,
            powerups_used_count=powerups_used,
            death_cause=death_cause,
            character_used=character_used,
            skin_used=skin_used,
            is_valid=is_valid
        )

        # Save telemetry batches
        telemetry_objs = []
        for t in telemetry_events[:100]:  # Cap to top 100 events
            telemetry_objs.append(RunTelemetry(
                run=game_run,
                timestamp_sec=float(t.get('t', 0.0)),
                event_type=t.get('event', 'EVENT'),
                lane=int(t.get('lane', 0)),
                speed=float(t.get('speed', 0.0)),
                data=t.get('data', {})
            ))
        if telemetry_objs:
            RunTelemetry.objects.bulk_create(telemetry_objs)

        new_high_score = False
        new_unlocked_achievements = []
        new_completed_missions = []
        updated_profile_data = {}

        if user and user.is_authenticated and is_valid:
            profile, _ = PlayerProfile.objects.get_or_create(user=user)
            
            # Update player profile
            if score > profile.high_score:
                profile.high_score = score
                new_high_score = True
            
            profile.total_score += score
            profile.total_distance_m += distance
            profile.total_coins += coins
            profile.total_runs += 1
            profile.save()

            # Update Leaderboards
            cls.update_leaderboards(user, score, distance, coins, character_used)

            # Update Achievements
            new_unlocked_achievements = cls.update_achievements(profile, score, distance, coins, powerups_used)

            # Update Missions
            new_completed_missions = cls.update_missions(user, score, distance, coins, powerups_used)

            updated_profile_data = {
                'high_score': profile.high_score,
                'total_coins': profile.total_coins,
                'total_gems': profile.total_gems,
                'total_runs': profile.total_runs,
                'total_distance_m': round(profile.total_distance_m, 1)
            }

        return {
            'run_id': str(game_run.id),
            'is_valid': is_valid,
            'new_high_score': new_high_score,
            'score': score,
            'coins': coins,
            'distance_m': round(distance, 1),
            'unlocked_achievements': new_unlocked_achievements,
            'completed_missions': new_completed_missions,
            'profile': updated_profile_data
        }

    @staticmethod
    def update_leaderboards(user, score, distance, coins, character):
        now = timezone.now()
        periods = [
            ('ALL_TIME', 'all'),
            ('WEEKLY', f"{now.year}-W{now.isocalendar()[1]}"),
            ('DAILY', now.strftime('%Y-%m-%d')),
        ]
        for timeframe, period_key in periods:
            rec, created = LeaderboardRecord.objects.get_or_create(
                user=user,
                timeframe=timeframe,
                period_key=period_key,
                defaults={
                    'score': score,
                    'distance_m': distance,
                    'coins': coins,
                    'character_used': character
                }
            )
            if not created and score > rec.score:
                rec.score = score
                rec.distance_m = distance
                rec.coins = coins
                rec.character_used = character
                rec.save()

    @staticmethod
    def update_achievements(profile, run_score, run_distance, run_coins, run_powerups):
        seed_achievements()
        user = profile.user
        unlocked_list = []
        achievements = Achievement.objects.all()

        for ach in achievements:
            ua, _ = UserAchievement.objects.get_or_create(user=user, achievement=ach)
            if ua.is_unlocked:
                continue

            # Calculate progress based on category
            if ach.category == 'DISTANCE':
                ua.current_progress = int(profile.total_distance_m)
            elif ach.category == 'COINS':
                ua.current_progress = profile.total_coins
            elif ach.category == 'SCORE':
                ua.current_progress = profile.high_score
            elif ach.category == 'RUNS':
                ua.current_progress = profile.total_runs
            elif ach.category == 'POWERUPS':
                ua.current_progress += run_powerups

            if ua.current_progress >= ach.target_value:
                ua.is_unlocked = True
                ua.unlocked_at = timezone.now()
                unlocked_list.append({
                    'id': ach.id,
                    'name': ach.name,
                    'icon': ach.icon,
                    'reward_coins': ach.reward_coins,
                    'reward_gems': ach.reward_gems
                })
            ua.save()

        return unlocked_list

    @staticmethod
    def update_missions(user, run_score, run_distance, run_coins, run_powerups):
        assign_user_daily_missions(user)
        today = timezone.now().date()
        user_missions = UserMission.objects.filter(user=user, assigned_date=today, is_completed=False).select_related('mission')
        completed_list = []

        for um in user_missions:
            m = um.mission
            if m.objective_type == 'COINS_SINGLE_RUN':
                if run_coins > um.current_value:
                    um.current_value = run_coins
            elif m.objective_type == 'COINS_TOTAL':
                um.current_value += run_coins
            elif m.objective_type == 'DISTANCE_SINGLE_RUN':
                if int(run_distance) > um.current_value:
                    um.current_value = int(run_distance)
            elif m.objective_type == 'DISTANCE_TOTAL':
                um.current_value += int(run_distance)
            elif m.objective_type == 'SCORE_SINGLE_RUN':
                if run_score > um.current_value:
                    um.current_value = run_score
            elif m.objective_type == 'POWERUPS_COLLECTED':
                um.current_value += run_powerups

            if um.current_value >= m.target_value:
                um.is_completed = True
                um.completed_at = timezone.now()
                completed_list.append({
                    'id': um.id,
                    'title': m.title,
                    'reward_coins': m.reward_coins,
                    'reward_gems': m.reward_gems,
                    'icon': m.icon
                })
            um.save()

        return completed_list
