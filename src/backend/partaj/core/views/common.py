"""
Common views that serve a purpose for any Partaj user.
"""
import codecs
import csv
import mimetypes

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef
from django.http import FileResponse, HttpResponse, HttpResponseBadRequest
from django.shortcuts import redirect
from django.utils.translation import gettext as _
from django.views import View
from django.views.generic import TemplateView

from .. import models, services
from ..models import (
    NoteDocument,
    Referral,
    ReferralAnswer,
    ReferralAnswerAttachment,
    ReferralAttachment,
    ReferralMessageAttachment,
    ReferralReportAttachment,
    ReferralState,
    VersionDocument,
)
from ..requests.note_api_request import NoteApiRequest
from ..transform_prosemirror_docx import TransformProsemirrorDocx


class PosteNoteNotix(LoginRequiredMixin, View):
    """
    Return one referral and post it to Notix app.
    """

    # pylint: disable=broad-except
    def get(self, request, referral_id):
        """
        Get one DB referral and post it to Notix
        """

        response = HttpResponse()
        api_note_request = NoteApiRequest()

        referral = Referral.objects.get(id=referral_id)
        if not referral:
            response.write("Referral n°" + str(referral_id) + ": does not exist.")
            return response

        if referral.answer_type == models.ReferralAnswerTypeChoice.NONE:
            return HttpResponseBadRequest(
                "Les saisines dont le type de réponse est Aucune ne sont pas exportées vers Notix"
            )

        try:
            if services.FeatureFlagService.get_referral_version(referral) == 1:

                if referral.report and referral.report.published_at:
                    api_note_request.post_note_new_answer_version(referral)
                else:
                    response.write(
                        "Referral answer for referral n°"
                        + str(referral_id)
                        + " does not exist."
                    )
                    return response
            else:
                referral_answer = ReferralAnswer.objects.filter(
                    state=models.ReferralAnswerState.PUBLISHED, referral__id=referral_id
                ).last()

                if not referral_answer:
                    response.write(
                        "Referral answer for referral n°"
                        + str(referral_id)
                        + " does not exist."
                    )
                    return response
                api_note_request.post_note(referral_answer)

        except ValueError as exception:
            for i in exception.args:
                response.write(i)
            response.write(
                "Referral n°" + str(referral_id) + ": failed to create notice."
            )
            return response

        except Exception as exception:
            for i in exception.args:
                response.write(i)
            return response

        response.write(
            "Referral n°" + str(referral_id) + ": notice created with success."
        )
        return response


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
