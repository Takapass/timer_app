from django.contrib import admin
from .models import TrainingMenu, TrainingSession
import csv
from django.http import HttpResponse


@admin.register(TrainingMenu)
class TrainingMenuAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "work_seconds", "rest_seconds", "sets", "countdown_mode", "created_at")
    list_filter = ("user",)


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "menu", "duration_display", "sets_completed", "created_at")
    list_filter = ("user", "menu", "created_at")
    actions = ["export_as_csv"]

    def export_as_csv(self, request, queryset):
        """
        選択したセッションを CSV ダウンロードします。
        列: user, menu, duration_seconds, duration_display, sets_completed, note, created_at
        """
        meta = self.model._meta
        fieldnames = ["user", "menu", "duration_seconds", "duration_display", "sets_completed", "note", "created_at"]
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename=sessions_export.csv'
        writer = csv.writer(response)
        writer.writerow(fieldnames)
        for obj in queryset:
            writer.writerow([
                obj.user.username,
                obj.menu.name if obj.menu else "",
                obj.duration_seconds,
                obj.duration_display(),
                obj.sets_completed,
                obj.note,
                obj.created_at.astimezone().strftime("%Y-%m-%d %H:%M:%S"),
            ])
        return response

    export_as_csv.short_description = "選択したセッションをCSVでエクスポート"
