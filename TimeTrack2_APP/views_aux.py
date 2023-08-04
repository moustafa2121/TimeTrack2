from django.forms import ModelForm
from .models import Section
from django import forms

class SectionForm(ModelForm):
    class Meta:
        model = Section
        fields = ["name", "parentSection"]
        
        widgets = {
            "name":forms.TextInput(attrs={"placeholder":"New Section"}),
            "parentSection":forms.HiddenInput(),
        }
