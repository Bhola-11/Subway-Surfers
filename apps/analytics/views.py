import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import EventLog

@require_POST
def log_event_api(request):
    try:
        payload = json.loads(request.body.decode('utf-8'))
        event_name = payload.get('event_name', 'UNKNOWN')
        event_data = payload.get('data', {})
        session_id = payload.get('session_id', '')

        EventLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=session_id,
            event_name=event_name,
            event_payload=event_data
        )
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
