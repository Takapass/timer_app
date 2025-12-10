from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class TrainingMenu(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    # 追加: デフォルトのワーク・レスト時間（秒）とセット数、カウントモード
    work_seconds = models.PositiveIntegerField(default=45)     # デフォルト 45秒
    rest_seconds = models.PositiveIntegerField(default=60)     # デフォルト 60秒
    sets = models.PositiveIntegerField(default=3)              # デフォルト 3セット
    # True = カウントダウンモード（例: 00:45 → 00:00）, False = カウントアップ（現行）
    countdown_mode = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name


class TrainingSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    menu = models.ForeignKey(TrainingMenu, on_delete=models.SET_NULL, null=True, blank=True)
    # 合計実働秒（ワーク中の合計 or 総経過）を保存
    duration_seconds = models.PositiveIntegerField(default=0)
    # セット数（実際に行ったセット）
    sets_completed = models.PositiveIntegerField(default=0)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def duration_display(self):
        # hh:mm:ss ではなく mm:ss を返す（必要なら拡張）
        s = int(self.duration_seconds)
        h = s // 3600
        m = (s % 3600) // 60
        sec = s % 60
        if h:
            return f"{h:d}:{m:02d}:{sec:02d}"
        return f"{m:02d}:{sec:02d}"

    def __str__(self):
        menu = self.menu.name if self.menu else "未設定"
        return f"{self.user.username} - {menu} - {self.duration_display()}"
