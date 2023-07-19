from django.contrib import admin
from .models import Section, SessionTime, Actionable, ActionableChoices

# Register your models here.


admin.site.register(Section)
admin.site.register(SessionTime)
admin.site.register(Actionable)
admin.site.register(ActionableChoices)