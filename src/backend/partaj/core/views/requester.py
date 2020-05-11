"""
Views dedicated to the requester. Create a referral and everything else they
need to do in Partaj.
"""
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views import View
from django.views.generic import DetailView, ListView

from ..email import Mailer
from ..forms import ReferralForm
from ..models import Referral, ReferralAttachment


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
        form = ReferralForm(request.POST, request.FILES)

        if form.is_valid():
            referral = form.save()
            # Add the currently logged in user to the Referral object
            referral.user = request.user
            referral.save()

            files = request.FILES.getlist("files")
            for file in files:
                referral_attachment = ReferralAttachment(file=file, referral=referral)
                referral_attachment.save()

            # The form is valid and we saved the referral: confirm it to the requester by email
            Mailer.send_referral_saved(referral)
            # Also alert the organizers for the relevant unit
            Mailer.send_referral_received(referral)

            # Redirect the user to the "single referral" view
            return HttpResponseRedirect(
                reverse("requester-referral-saved", kwargs={"pk": referral.id})
            )

        else:
            return HttpResponse(form.errors.as_text())


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


class RequesterReferralSavedView(LoginRequiredMixin, DetailView):
    """
    Show the user a screen confirming their referral request has been saved, and give
    them information regarding the next steps.
    """

    model = Referral
    template_name = "core/requester/referral_saved.html"
