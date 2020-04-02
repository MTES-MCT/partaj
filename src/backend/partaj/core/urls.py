"""
Routes exposed by our core app.
"""
from django.conf import settings
from django.urls import path

from .views import (
    AuthenticatedFilesView,
    IndexView,
    NewReferralView,
    ReferralReceivedView,
)

urlpatterns = [
    path(
        f"{settings.REFERRAL_ATTACHMENT_FILES_PATH}<uuid:referral_attachment_id>/",
        AuthenticatedFilesView.as_view(),
        name="authenticated-files",
    ),
    path(
        "referral-received/<int:pk>/",
        ReferralReceivedView.as_view(),
        name="referral-received",
    ),
    path("new-referral/", NewReferralView.as_view(), name="new-referral"),
    path("", IndexView.as_view(), name="index"),
]
