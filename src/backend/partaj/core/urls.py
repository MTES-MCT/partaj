"""
Routes exposed by our core app.
"""
from django.conf import settings
from django.urls import include, path

from rest_framework import routers

from .views import (
    AuthenticatedFilesView,
    IndexView,
    ReferralViewSet,
    RequesterReferralCreateView,
    RequesterReferralSavedView,
    UnitInboxView,
    UnitReferralDetailView,
)

router = routers.DefaultRouter()
router.register(r'referral', ReferralViewSet)

urlpatterns = [
    # DRF API router
    path('api/', include(router.urls)),
    # Requester-side views
    path(
        "requester/referral-create/",
        RequesterReferralCreateView.as_view(),
        name="requester-referral-create",
    ),
    path(
        "requester/referral-saved/<int:pk>/",
        RequesterReferralSavedView.as_view(),
        name="requester-referral-saved",
    ),
    # Unit-side views
    path("unit/<uuid:unit_id>/inbox/", UnitInboxView.as_view(), name="unit-inbox"),
    path(
        "unit/<uuid:unit_id>/referral-detail/<int:pk>/",
        UnitReferralDetailView.as_view(),
        name="unit-inbox-referral-detail",
    ),
    # Common views
    path(
        f"{settings.REFERRAL_ATTACHMENT_FILES_PATH}<uuid:referral_attachment_id>/",
        AuthenticatedFilesView.as_view(),
        name="authenticated-files",
    ),
    path("", IndexView.as_view(), name="index"),
]
