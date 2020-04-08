"""
Common views that serve a purpose for any Partaj user.
"""
import mimetypes

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse, HttpResponse
from django.views import View
from django.views.generic import TemplateView

from ..models import ReferralAttachment


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


class IndexView(TemplateView):
    """
    Show a generic content-free view for non-logged in users.
    """

    template_name = "core/index.html"
