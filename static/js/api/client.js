/**
 * Metro Rush - API Client
 * Handles asynchronous communication with the Django backend.
 */
class ApiClient {
    constructor() {
        this.csrfToken = this.getCookie('csrftoken');
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    async post(url, data = {}) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken') || this.csrfToken || ''
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (err) {
            console.error(`API Error [POST ${url}]:`, err);
            return { status: 'error', message: err.message };
        }
    }

    async get(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (err) {
            console.error(`API Error [GET ${url}]:`, err);
            return { status: 'error', message: err.message };
        }
    }

    async startSession() {
        return this.post('/api/session/start/');
    }

    async submitRun(runData) {
        return this.post('/api/run/submit/', runData);
    }

    async getProfile() {
        return this.get('/api/players/profile/');
    }

    async getShopCatalog() {
        return this.get('/api/players/catalog/');
    }

    async unlockItem(type, id) {
        return this.post('/api/players/unlock/', { type, id });
    }

    async selectItem(characterSlug, skinSlug) {
        return this.post('/api/players/select/', { character_slug: characterSlug, skin_slug: skinSlug });
    }

    async upgradePowerup(type) {
        return this.post('/api/players/upgrade-powerup/', { type });
    }

    async getLeaderboard(timeframe = 'ALL_TIME') {
        return this.get(`/api/leaderboard/?timeframe=${timeframe}`);
    }

    async getMissions() {
        return this.get('/api/missions/');
    }

    async claimMission(userMissionId) {
        return this.post('/api/missions/claim/', { user_mission_id: userMissionId });
    }

    async getAchievements() {
        return this.get('/api/achievements/');
    }

    async claimAchievement(achievementId) {
        return this.post('/api/achievements/claim/', { achievement_id: achievementId });
    }

    async logTelemetry(eventName, data, sessionId) {
        return this.post('/api/analytics/log-event/', {
            event_name: eventName,
            data: data,
            session_id: sessionId
        });
    }
}

window.apiClient = new ApiClient();
