
# Uncomment next two lines to enable admin:
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('TimeTrack2_APP.urls')),
    path('accounts/', include('allauth.urls')),
    path('logout', LogoutView.as_view()),
]
"""
client id
191506131184-rne6iu8n832mrs0mnmaqu1jvg16q5eut.apps.googleusercontent.com
client secret
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
"""
