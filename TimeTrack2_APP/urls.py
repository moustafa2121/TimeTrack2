from django.urls import path
from . import views

app_name = "TimeTrack2_APP"
urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('add-actionable/', views.addActionable, name='addActionable'),
    path('update-actionable/', views.updateActionable, name='updateActionable'),
    path('delete-actionable/', views.deleteActionable, name='deleteActionable'),
    path('add-section/', views.addSection, name='addSection'),
    path('update-session/', views.updateSession, name='updateSession'),
    path('statscsv/', views.statsView, name='statView'),
]