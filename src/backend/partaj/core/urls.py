"""
Routes exposed by our core app.
"""
from django.conf import settings
from django.urls import path

from . import views

urlpatterns = [
    path(
        f"{settings.REFERRAL_ATTACHMENT_FILES_PATH}<uuid:referral_attachment_id>/",
        views.authenticated_files,
        name="authenticated-files",
    ),
    path(
        "referral-received/<int:pk>/",
        views.ReferralReceivedView.as_view(),
        name="referral-received",
    ),
    path("new-referral/", views.new_referral, name="new-referral"),
    path("", views.IndexView.as_view(), name="index"),
]
