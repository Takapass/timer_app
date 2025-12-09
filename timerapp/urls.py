from django.urls import path
from . import views

app_name = 'timerapp'

urlpatterns = [
    path('', views.home, name='home'),
    path('menus/', views.menus, name='menus'),
    path('api/add_menu/', views.api_add_menu, name='api_add_menu'),
    path('timer/<int:menu_id>/', views.timer_view, name='timer'),
    path('api/save_session/', views.api_save_session, name='api_save_session'),
    path('history/', views.history, name='history'),
]
