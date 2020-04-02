"""
Views for our Core app.
"""
import mimetypes
import os

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse, HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views import View
from django.views.generic import DetailView, TemplateView

from .email import send_email_referral_saved
from .forms import ReferralForm
from .models import Referral, ReferralAttachment


class IndexView(TemplateView):
    """
    Show a generic content-free view for non-logged in users.
    """

    template_name = "core/index.html"


class NewReferralView(LoginRequiredMixin, View):
    """
    View for the main referral form in Partaj.
    """

    def get(self, request):
        """
        Show the referral form for the user to fill in and submit.
        """
        form = ReferralForm()

        return render(request, "core/new_referral.html", {"form": form})

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
                # For each file, create a ReferralAttachment, passing the actual file name
                # as we're not offering users to name/tag their files for now
                file_name, _ = os.path.splitext(file.name)
                referral_attachment = ReferralAttachment(
                    file=file, name=file_name, referral=referral
                )
                referral_attachment.save()

            # The form is valid and we saved the referral: confirm it to the user by email
            send_email_referral_saved(referral)

            # Redirect the user to the "single referral" view
            return HttpResponseRedirect(
                reverse("referral-received", kwargs={"pk": referral.id})
            )

        else:
            return HttpResponse(form.errors.as_text())


class ReferralReceivedView(LoginRequiredMixin, DetailView):
    """
    Show the user a screen confirming their referral request has been received, and give
    them information regarding the next steps.
    """

    model = Referral
    template_name = "core/referral_received.html"


class AuthenticatedFilesView(LoginRequiredMixin, View):
    def get(self, request, referral_attachment_id):
        """
        Verify the current user is logged-in (using a builtin Django mixin) and allowed to see the
        requested referral attachment (TBD), then serve the file to them.

        NB: we are aware of the issues (wrt. monopolizing of Python threads and therefore scaling)
        with serving files directly with Django views.
        Given our setup and usage levels, it's an acceptable trade-off with the ease of deployment
        that we're making.
        """
        # Get the related referral attachment object or return a 404
        try:
            referral_attachment = ReferralAttachment.objects.get(
                id=referral_attachment_id
            )
        except ReferralAttachment.DoesNotExist:
            return HttpResponse(status=404)

        # Get the actual filename from the referral attachment (ie. remove the UUID prefix
        # and slash)
        filename = str(referral_attachment.file).rsplit("/", 1)[-1]

        # Get the content type and encoding to serve the file as best we can
        content_type, encoding = mimetypes.guess_type(str(filename))
        content_type = content_type or "application/octet-stream"

        # Actually serve the file using Django's http facilities
        response = FileResponse(
            referral_attachment.file.open("rb"), content_type=content_type
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        if encoding:
            response["Content-Encoding"] = encoding

        return response
