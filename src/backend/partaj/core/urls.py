"""
Routes exposed by our core app.
"""
from django.conf import settings
from django.urls import include, path, re_path

from rest_framework import routers

from . import api, views

router = routers.DefaultRouter()
router.register(r"featureflags", api.FeatureFlagViewSet, "featureflags")
router.register(r"referrals", api.ReferralViewSet, "referrals")
router.register(r"referrallites", api.ReferralLiteViewSet, "referrallites")
router.register(r"noteslites", api.NoteLiteViewSet, "noteslite")
router.register(r"notes", api.NoteViewSet, "notes")
router.register(
    r"referralactivities", api.ReferralActivityViewSet, "referralactivities"
)

router.register(
    r"referralrelationships", api.ReferralRelationshipViewSet, "referralrelationships"
)
router.register(r"referralanswers", api.ReferralAnswerViewSet, "referralanswers")
router.register(r"referralreports", api.ReferralReportViewSet, "referralreports")
router.register(
    r"referralreportversions",
    api.ReferralReportVersionViewSet,
    "referralreportversions",
)
router.register(
    r"referralanswerattachments",
    api.ReferralAnswerAttachmentViewSet,
    "referralanswerattachments",
)
router.register(
    r"referralattachments", api.ReferralAttachmentViewSet, "referralattachments"
)

router.register(
    r"referralanswervalidationrequests",
    api.ReferralAnswerValidationRequestViewSet,
    "referralanswervalidationrequests",
)
router.register(r"referralmessages", api.ReferralMessageViewSet, "referralmessages")
router.register(r"reportevents", api.ReportEventViewSet, "reportevents")
router.register(r"topics", api.TopicViewSet, "topics")
router.register(r"topiclites", api.TopicLiteViewSet, "topicslites")
router.register(r"units", api.UnitViewSet, "units")
router.register(r"unitlites", api.UnitLiteViewSet, "units")
router.register(r"unitmemberships", api.UnitMembershipViewSet, "unitmemberships")
router.register(r"urgencies", api.ReferralUrgencyViewSet, "urgencies")
router.register(r"users", api.UserViewSet, "users")
router.register(r"userlites", api.UserLiteViewSet, "users")

urlpatterns = [
    # DRF API router
    path("api/", include(router.urls)),
    # Common views
    path(
        f"{settings.ATTACHMENT_FILES_PATH}<uuid:attachment_id>/",
        views.AuthenticatedFilesView.as_view(),
        name="authenticated-files",
    ),
    path("export/", views.ExportView.as_view(), name="export"),
    path(
        "export-referral/<int:referral_id>/",
        views.ExportReferralView.as_view(),
        name="ExportReferralView",
    ),
    path(
        "export-new-referral/<int:referral_id>/",
        views.ExportNewReferralView.as_view(),
        name="ExportNewReferralView",
    ),
    re_path("app/.*", views.AppView.as_view(), name="app"),
    path("stats/", views.StatsView.as_view(), name="stats"),
    path("legal/", views.LegalMentionsView.as_view(), name="legal-mentions"),
    path("accessibilite/", views.AccessibilityView.as_view(), name="accessibility"),
    path("", views.IndexView.as_view(), name="index"),
]
