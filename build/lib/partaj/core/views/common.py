"""
Common views that serve a purpose for any Partaj user.
"""
import codecs
import csv
import mimetypes

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef
from django.http import FileResponse, HttpResponse
from django.shortcuts import redirect
from django.utils.translation import gettext as _
from django.views import View
from django.views.generic import TemplateView

from .. import models
from ..models import (
    NoteDocument,
    ReferralAnswerAttachment,
    ReferralAttachment,
    ReferralMessageAttachment,
    ReferralReportAttachment,
    ReferralState,
    VersionDocument,
)
from ..services.files.referral_to_docx import ReferralDocx
from ..transform_prosemirror_docx import TransformProsemirrorDocx


class ExportReferralView(LoginRequiredMixin, View):
    """
    Return one referral as a word file to authenticated users.
    """

    def get(self, request, referral_id):
        """
        Build and return the word file
        """
        referral = models.Referral.objects.get(id=referral_id)

        transform_mirror = TransformProsemirrorDocx()
        referral_doc = transform_mirror.referral_to_docx(referral)

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        response["Content-Disposition"] = (
            "attachment; filename=saisine-" + str(referral.id) + ".docx"
        )
        referral_doc.save(response)
        return response


class ExportNewReferralView(LoginRequiredMixin, View):
    """
    Return one referral as a word file to authenticated users.
    """

    def get(self, request, referral_id):
        """
        Build and return the word file
        """
        referral = models.Referral.objects.get(id=referral_id)

        referral_to_docx_service = ReferralDocx()
        referral_doc = referral_to_docx_service.referral_to_docx(referral)

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        response["Content-Disposition"] = (
            "attachment; filename=saisine-" + str(referral.id) + ".docx"
        )
        referral_doc.save(response)
        return response


class ExportView(LoginRequiredMixin, View):
    """
    Return a list of referrals as a csv file to authenticated users.
    """

    def get_queryset(self):
        """
        fFilter referrals and return a ready-to-use queryset.
        """

        queryset = models.Referral.objects.exclude(state=ReferralState.DRAFT).annotate(
            due_date=ExpressionWrapper(
                F("sent_at") + F("urgency_level__duration"),
                output_field=DateTimeField(),
            )
        )

        queryset = (
            queryset.annotate(
                is_user_related_unit_member=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("units"), user=self.request.user
                    )
                )
            )
            # Only include referral where the user is part of a linked unit
            .filter(is_user_related_unit_member=True).distinct()
        )
        return queryset

    def get(self, request):
        """
        Build and return the csv file
        """
        queryset = self.get_queryset()

        response = HttpResponse(content_type="application/force-download")
        response["Content-Disposition"] = "attachment; filename=saisines.csv"
        response.write(codecs.BOM_UTF8)
        writer = csv.writer(response, delimiter=";", quoting=csv.QUOTE_ALL)
        writer.writerow(
            [
                _("id"),
                _("object"),
                _("topic"),
                _("units"),
                _("due date"),
                _("requesters"),
                _("assignees"),
                _("status"),
            ]
        )
        for ref in queryset.all():
            writer.writerow(
                [
                    str(ref.id),
                    ref.object,
                    ref.topic.name,
                    " - ".join([unit.name for unit in ref.units.all()]),
                    ref.due_date.strftime("%m/%d/%Y"),
                    " - ".join([user.get_full_name() for user in ref.users.all()]),
                    " - ".join([user.get_full_name() for user in ref.assignees.all()]),
                    models.ReferralState(ref.state).label,
                ]
            )
        return response


class AuthenticatedFilesView(LoginRequiredMixin, View):
    """
    Return attachment files to authenticated users.
    """

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
        for klass in [
            VersionDocument,
            NoteDocument,
            ReferralReportAttachment,
            ReferralAttachment,
            ReferralAnswerAttachment,
            ReferralMessageAttachment,
        ]:
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
        content_type, _ = mimetypes.guess_type(str(filename))
        content_type = content_type or "application/octet-stream"

        # Actually serve the file using Django's http facilities
        response = FileResponse(
            attachment.file.open("rb"),
            content_type=content_type,
            as_attachment=True,
            filename=filename,
        )

        return response


class AppView(LoginRequiredMixin, TemplateView):
    """
    View for the frontent app in Partaj.
    """

    template_name = "core/app.html"


class LegalMentionsView(TemplateView):
    """
    Plain template view for legal mentions.
    """

    template_name = "core/legal_mentions.html"


class AccessibilityView(TemplateView):
    """
    Plain template view for accessibility statement.
    """

    template_name = "core/accessibility.html"


class IndexView(TemplateView):
    """
    Show a generic content-free view for non-logged in users.
    """

    template_name = "core/index.html"

    def dispatch(self, *args, **kwargs):
        """
        Redirect logged in users to the app (and therefore the Dashboard) which should be their
        homepage.
        """
        if self.request.user.is_authenticated:
            return redirect("/app")
        return super().dispatch(*args, **kwargs)
