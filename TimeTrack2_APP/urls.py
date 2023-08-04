
from django.urls import path, include
from django.views.generic import TemplateView
from . import views

app_name = "TimeTrack2_APP"
urlpatterns = [
    #path('', TemplateView.as_view(template_name="index.html")),
    path('', views.homepage, name='homepage'),
    path('add-actionable/', views.addActionable, name='addActionable'),
    path('update-actionable/', views.updateActionable, name='updateActionable'),
    path('add-section/', views.addSection, name='addSection'),
    path('update-session/', views.updateSession, name='updateSession'),

]