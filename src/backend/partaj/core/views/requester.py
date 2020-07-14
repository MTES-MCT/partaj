"""
Views dedicated to the requester. Create a referral and everything else they
need to do in Partaj.
"""
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import DetailView, ListView
from django.views.generic.base import TemplateView

from ..models import Referral


class UserIsReferralRequesterMixin(UserPassesTestMixin):
    """
    Use a django builtin mixin to implement requester authorization.
    """

    def test_func(self):
        """
        Make sure the user is the author of the referral before letting them access the view.
        """
        referral = self.get_object()
        return self.request.user == referral.user


class RequesterReferralCreateView(LoginRequiredMixin, TemplateView):
    """
    View for the main referral form in Partaj.
    """

    template_name = "core/requester/referral_create.html"


class RequesterReferralDetailView(
    LoginRequiredMixin, UserIsReferralRequesterMixin, DetailView
):
    """
    The requester referral detail view shows the user all the information they can access
    on a referral they have created.
    """

    breadcrumbs = [
        "requester",
        "requester-referral-list",
        "requester-referral-list-detail",
    ]
    model = Referral
    pk_url_kwarg = "referral_id"
    template_name = "core/requester/referral_detail.html"


class RequesterReferralListView(LoginRequiredMixin, ListView):
    """
    The requester referral list view shows the user all the referrals they
    have created so far on Partaj.
    """

    breadcrumbs = ["requester", "requester-referral-list"]
    context_object_name = "referrals"
    template_name = "core/requester/referral_list.html"

    def get_queryset(self):
        """
        Limit the referrals queryset to those linked to the current user as a requester.
        """
        return Referral.objects.filter(user=self.request.user).order_by("-created_at")


class RequesterReferralSavedView(
    LoginRequiredMixin, UserIsReferralRequesterMixin, DetailView
):
    """
    Show the user a screen confirming their referral request has been saved, and give
    them information regarding the next steps.
    """

    model = Referral
    pk_url_kwarg = "referral_id"
    template_name = "core/requester/referral_saved.html"
