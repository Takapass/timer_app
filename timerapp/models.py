from django.db import models
from django.contrib.auth.models import User


class TrainingMenu(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='menus')
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TrainingSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    menu = models.ForeignKey(TrainingMenu, on_delete=models.SET_NULL, null=True, blank=True)
    duration_seconds = models.PositiveIntegerField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def duration_display(self):
        m, s = divmod(self.duration_seconds, 60)
        return f"{m:02d}:{s:02d}"

    def __str__(self):
        return f"{self.user} - {self.menu} - {self.duration_display()}"
