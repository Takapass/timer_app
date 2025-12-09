from django import forms
from .models import TrainingMenu


class TrainingMenuForm(forms.ModelForm):
    class Meta:
        model = TrainingMenu
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'メニュー名', 'class': 'input-field'}),
        }
