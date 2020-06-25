"""
Routes exposed by our core app.
"""
from django.conf import settings
from django.urls import include, path

from rest_framework import routers

from . import api
from .views import (
    AuthenticatedFilesView,
    IndexView,
    RequesterReferralCreateView,
    RequesterReferralDetailView,
    RequesterReferralListView,
    RequesterReferralSavedView,
    UnitInboxView,
    UnitMembersView,
    UnitReferralDetailView,
    UnitTopicsView,
)

router = routers.DefaultRouter()
router.register(r"referrals", api.ReferralViewSet, "referrals")
router.register(r"topics", api.TopicViewSet, "topics")
router.register(r"users", api.UserViewSet, "users")

urlpatterns = [
    # DRF API router
    path("api/", include(router.urls)),
    # Requester-side views
    path(
        "requester/",
        include(
            [
                path(
                    "referral-create/",
                    RequesterReferralCreateView.as_view(),
                    name="requester-referral-create",
                ),
                path(
                    "referral-detail/<int:referral_id>/",
                    RequesterReferralDetailView.as_view(),
                    name="requester-referral-detail",
                ),
                path(
                    "referral-list/",
                    RequesterReferralListView.as_view(),
                    name="requester-referral-list",
                ),
                path(
                    "referral-saved/<int:referral_id>/",
                    RequesterReferralSavedView.as_view(),
                    name="requester-referral-saved",
                ),
            ]
        ),
    ),
    # Unit-side views
    path(
        "unit/<uuid:unit_id>/",
        include(
            [
                path("inbox/", UnitInboxView.as_view(), name="unit-inbox"),
                path(
                    "referral-detail/<int:pk>/",
                    UnitReferralDetailView.as_view(),
                    name="unit-inbox-referral-detail",
                ),
                path("members/", UnitMembersView.as_view(), name="unit-members"),
                path("topics/", UnitTopicsView.as_view(), name="unit-topics"),
            ]
        ),
    ),
    # Common views
    path(
        f"{settings.ATTACHMENT_FILES_PATH}<uuid:attachment_id>/",
        AuthenticatedFilesView.as_view(),
        name="authenticated-files",
    ),
    path("", IndexView.as_view(), name="index"),
]
