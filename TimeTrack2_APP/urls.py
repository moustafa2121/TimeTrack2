
from django.urls import path, include
from django.views.generic import TemplateView
from . import views

app_name = "TimeTrack2_APP"
urlpatterns = [
    #path('', TemplateView.as_view(template_name="index.html")),
    path('', views.homepage, name='homepage')
    
]