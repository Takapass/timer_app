from django.contrib import admin
from .models import TrainingMenu, TrainingSession


@admin.register(TrainingMenu)
class TrainingMenuAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'menu', 'duration_seconds', 'created_at')
