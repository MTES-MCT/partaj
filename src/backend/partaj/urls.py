"""
Partaj URLS.
"""
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path

urlpatterns = [
    path("", include("partaj.core.urls")),
    path("admin/", admin.site.urls),
] + staticfiles_urlpatterns()
