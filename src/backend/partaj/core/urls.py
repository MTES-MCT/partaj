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
    UnitInboxView,
)

urlpatterns = [
    # Requester-side views
    path(
        "referral-received/<int:pk>/",
        ReferralReceivedView.as_view(),
        name="referral-received",
    ),
    path("new-referral/", NewReferralView.as_view(), name="new-referral"),
    # Unit-side views
    path("unit/<uuid:unit_id>/inbox/", UnitInboxView.as_view(), name="unit-inbox"),
    # Common views
    path(
        f"{settings.REFERRAL_ATTACHMENT_FILES_PATH}<uuid:referral_attachment_id>/",
        AuthenticatedFilesView.as_view(),
        name="authenticated-files",
    ),
    path("", IndexView.as_view(), name="index"),
]
