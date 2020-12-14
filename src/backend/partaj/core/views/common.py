"""
Common views that serve a purpose for any Partaj user.
"""
import mimetypes

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse, HttpResponse
from django.views import View
from django.views.generic import TemplateView

from ..models import ReferralAnswerAttachment, ReferralAttachment


class AuthenticatedFilesView(LoginRequiredMixin, View):
    def get(self, request, attachment_id):
        """
        Verify the current user is logged-in (using a builtin Django mixin) and allowed to see the
        requested attachment (TBD), then serve the file to them.

        NB: we are aware of the issues (wrt. monopolizing of Python threads and therefore scaling)
        with serving files directly with Django views.
        Given our setup and usage levels, it's an acceptable trade-off with the ease of deployment
        that we're making.
        """

        # Try to get the attachment from our attachment models
        attachment = None
        for klass in [ReferralAttachment, ReferralAnswerAttachment]:
            if not attachment:
                try:
                    attachment = klass.objects.get(id=attachment_id)
                except klass.DoesNotExist:
                    pass
        # None of the models had an attachment matching this ID
        if not attachment:
            return HttpResponse(status=404)

        # Get the actual filename from the referral attachment (ie. remove the UUID prefix
        # and slash)
        filename = str(attachment.file).rsplit("/", 1)[-1]

        # Get the content type and encoding to serve the file as best we can
        content_type, encoding = mimetypes.guess_type(str(filename))
        content_type = content_type or "application/octet-stream"

        # Actually serve the file using Django's http facilities
        response = FileResponse(
            attachment.file.open("rb"),
            content_type=content_type,
            as_attachment=True,
            filename=filename,
        )

        return response


class DashboardView(LoginRequiredMixin, TemplateView):
    """
    View for the dashboard form in Partaj.
    """

    template_name = "core/dashboard.html"


class IndexView(TemplateView):
    """
    Show a generic content-free view for non-logged in users.
    """

    template_name = "core/index.html"
