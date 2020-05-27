"""
Partaj URLS.
"""
from django.contrib import admin
from django.urls import include, path

import django_cas_ng.views

urlpatterns = [
    path("", include("partaj.core.urls")),
    path("admin/", admin.site.urls),
    path("impersonate/", include("impersonate.urls")),
    path(
        "accounts/login", django_cas_ng.views.LoginView.as_view(), name="cas_ng_login"
    ),
    path(
        "accounts/logout",
        django_cas_ng.views.LogoutView.as_view(),
        name="cas_ng_logout",
    ),
]
