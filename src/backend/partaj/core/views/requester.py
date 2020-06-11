"""
Views dedicated to the requester. Create a referral and everything else they
need to do in Partaj.
"""
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views import View
from django.views.generic import DetailView, ListView

from ..forms import ReferralForm
from ..models import Referral, ReferralAttachment


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


class RequesterReferralCreateView(LoginRequiredMixin, View):
    """
    View for the main referral form in Partaj.
    """

    def get(self, request):
        """
        Show the referral form for the user to fill in and submit.
        """
        form = ReferralForm()

        return render(request, "core/requester/referral_create.html", {"form": form})

    def post(self, request):
        """
        The form is submitted: validate it,end the "referral saved" email and redirect the
        user to the follow-up view.
        """

        form = ReferralForm(
            {
                # Add the currently logged in user to the Referral object we're building
                "user": request.user.id,
                **{key: value for key, value in request.POST.items()},
            },
            request.FILES,
        )

        if form.is_valid():
            referral = form.save()

            files = request.FILES.getlist("files")
            for file in files:
                referral_attachment = ReferralAttachment(file=file, referral=referral)
                referral_attachment.save()

            referral.send()

            # Redirect the user to the "single referral" view
            return HttpResponseRedirect(
                reverse("requester-referral-saved", kwargs={"referral_id": referral.id})
            )

        else:
            return HttpResponse(form.errors.as_text())


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
