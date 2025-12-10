from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseBadRequest
from .models import TrainingMenu, TrainingSession
from .forms import TrainingMenuForm
import json


def home(request):
    return render(request, 'timerapp/home.html')


@login_required
def menus(request):
    form = TrainingMenuForm()
    user_menus = TrainingMenu.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'timerapp/menus.html', {'form': form, 'menus': user_menus})


@login_required
def api_add_menu(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = json.loads(request.body)
        name = data.get('name')
        if not name:
            return JsonResponse({'error': '名前を入力してください'}, status=400)
        # optional: accept work_seconds, rest_seconds, sets, countdown_mode from data
        menu = TrainingMenu.objects.create(
            user=request.user,
            name=name,
            work_seconds=int(data.get('work_seconds', 45)),
            rest_seconds=int(data.get('rest_seconds', 60)),
            sets=int(data.get('sets', 3)),
            countdown_mode=bool(data.get('countdown_mode', False)),
        )
        return JsonResponse({'id': menu.id, 'name': menu.name})
    return HttpResponseBadRequest()


@login_required
def timer_view(request, menu_id):
    menu = get_object_or_404(TrainingMenu, id=menu_id, user=request.user)
    # テンプレートにメニューのタイマー関連設定を渡す
    return render(request, 'timerapp/timer.html', {
        'menu': menu,
        'menu_json': {
            'work_seconds': menu.work_seconds,
            'rest_seconds': menu.rest_seconds,
            'sets': menu.sets,
            'countdown_mode': menu.countdown_mode,
        }
    })


@login_required
def api_save_session(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = json.loads(request.body)
        menu_id = data.get('menu_id')
        duration = int(data.get('duration', 0))
        note = data.get('note', '')
        sets_completed = int(data.get('sets_completed', 0))
        menu = None
        if menu_id:
            try:
                menu = TrainingMenu.objects.get(id=menu_id, user=request.user)
            except TrainingMenu.DoesNotExist:
                menu = None
        session = TrainingSession.objects.create(
            user=request.user,
            menu=menu,
            duration_seconds=duration,
            sets_completed=sets_completed,
            note=note
        )
        return JsonResponse({'id': session.id, 'duration_display': session.duration_display(), 'created_at': session.created_at.isoformat()})
    return HttpResponseBadRequest()


@login_required
def history(request):
    sessions = TrainingSession.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'timerapp/history.html', {'sessions': sessions})
