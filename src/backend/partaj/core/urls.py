"""
Routes exposed by our core app.
"""
from django.conf import settings
from django.urls import include, path

from rest_framework import routers

from . import api
from . import views

router = routers.DefaultRouter()
router.register(r"referrals", api.ReferralViewSet, "referrals")
router.register(
    r"referralactivities", api.ReferralActivityViewSet, "referralactivities"
)
router.register(r"referralanswers", api.ReferralAnswerViewSet, "referralanswers")
router.register(
    r"referralanswerattachments",
    api.ReferralAnswerAttachmentViewSet,
    "referralanswerattachments",
)
router.register(
    r"referralanswervalidationrequests",
    api.ReferralAnswerValidationRequestViewSet,
    "referralanswervalidationrequests",
)
router.register(r"tasks", api.TaskViewSet, "tasks")
router.register(r"topics", api.TopicViewSet, "topics")
router.register(r"unitmemberships", api.UnitMembershipViewSet, "unitmemberships")
router.register(r"urgencies", api.UrgencyViewSet, "urgencies")
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
                    views.RequesterReferralCreateView.as_view(),
                    name="requester-referral-create",
                ),
                path(
                    "referral-detail/<int:referral_id>/",
                    views.RequesterReferralDetailView.as_view(),
                    name="requester-referral-detail",
                ),
                path(
                    "referral-list/",
                    views.RequesterReferralListView.as_view(),
                    name="requester-referral-list",
                ),
                path(
                    "referral-saved/<int:referral_id>/",
                    views.RequesterReferralSavedView.as_view(),
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
                path("inbox/", views.UnitInboxView.as_view(), name="unit-inbox"),
                path(
                    "referral-detail/<int:pk>/",
                    views.UnitReferralDetailView.as_view(),
                    name="unit-inbox-referral-detail",
                ),
                path("members/", views.UnitMembersView.as_view(), name="unit-members"),
                path("topics/", views.UnitTopicsView.as_view(), name="unit-topics"),
            ]
        ),
    ),
    # Common views
    path(
        f"{settings.ATTACHMENT_FILES_PATH}<uuid:attachment_id>/",
        views.AuthenticatedFilesView.as_view(),
        name="authenticated-files",
    ),
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("stats/", views.StatsView.as_view(), name="stats"),
    path("", views.IndexView.as_view(), name="index"),
]
