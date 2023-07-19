from io import BytesIO
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from utils.mock_referral import mock_create_referral


@mock.patch("partaj.core.email.Mailer.send")
class ReferralReportRequestValidationApiTestCase(TestCase):
    """
    Test API routes related to ReferralReportVersion validation endpoints.
    """

    # Request validation API TESTS
    def test_referralreport_requestvalidation_by_linked_unit_user(self, mock_mailer_send):
        """
        Test
        - Can't request validation on a draft, closed or answered referral
        - Referral changes its state to IN_VALIDATION at the first validation request
        - API Response is well returned with a well-formatted version
        - Mails are sent to unit owner from the specified unit
        """

        """ Initialize requesters, unit members and referral """
        requester_1 = factories.UserFactory(unit_name='tieps')
        requester_2 = factories.UserFactory(unit_name='tieps')
        unit_member_1 = factories.UserFactory()
        unit_member_2 = factories.UserFactory()

        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING, report
        )

        # Set requesters
        referral.users.set([requester_1.id, requester_2.id])

        # Add unit members
        referral.units.get().members.add(unit_member_1)
        referral.units.get().members.add(unit_member_2)

        # Add unit owner
        unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        referral.units.get().members.add(unit_owner)

        created_referral = models.Referral.objects.get(id=referral.id)
        created_referral.refresh_from_db()

        """
        Send a first version with the unit_member_1 and try to request validation
        with different unit members
        """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"
        unit_member_1_token = Token.objects.get_or_create(user=unit_member_1)[0]
        unit_member_2_token = Token.objects.get_or_create(user=unit_member_2)[0]

        # Send first version
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )

        self.assertEqual(first_version_response.status_code, 201)

        # Request validation with unit_member_2
        # FORBIDDEN: only version author can request validation
        unauthorized_request_validation = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_validation/",
            {"selected_options": [
                {
                    "role": "owner",
                    "unit_id": referral.units.get().id
                }
            ]},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_member_2_token}",
        )
        self.assertEqual(unauthorized_request_validation.status_code, 403)

        # Request validation with unit_member_1
        # AUTHORIZED: done by last version author on last version
        authorized_request_validation = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_validation/",
            {"selected_options": [
                {
                    "role": "owner",
                    "unit_id": referral.units.get().id
                }
            ]},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )
        self.assertEqual(authorized_request_validation.status_code, 200)

        # Check Validation events on first version
        active_validation_request_events = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_VALIDATION,
            state=models.ReportEventState.ACTIVE,
        ).count()

        self.assertEqual(active_validation_request_events, 1)

        # Request validation with unit_member_1 again
        # AUTHORIZED: done by last version author but inactivate the last validation
        self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_validation/",
            {"selected_options": [
                {
                    "role": "owner",
                    "unit_id": referral.units.get().id
                }
            ]},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )
        active_validation_request_events_after_second_validation = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_VALIDATION,
            state=models.ReportEventState.ACTIVE,
        ).count()

        inactive_validation_request_events_after_second_validation = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_VALIDATION,
            state=models.ReportEventState.INACTIVE,
        ).count()

        self.assertEqual(active_validation_request_events_after_second_validation, 1)
        self.assertEqual(inactive_validation_request_events_after_second_validation, 1)

        """
        Add a second version and check validation request on first version
        """
        second_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )

        self.assertEqual(second_version_response.status_code, 201)

        # Request validation with unit_member_1 for first version
        # FORBIDDEN: this is not the last version
        first_version_after_second_response = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_validation/",
            {"selected_options": [
                {
                    "role": "owner",
                    "unit_id": referral.units.get().id
                }
            ]},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )
        self.assertEqual(first_version_after_second_response.status_code, 403)
