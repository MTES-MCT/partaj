from io import BytesIO
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from utils.mail_sender_args import get_request_change
from utils.mock_referral import mock_create_referral


@mock.patch("partaj.core.email.Mailer.send")
class ReferralReportRequestChangeApiTestCase(TestCase):
    """
    Test API routes related to ReferralReportVersion validation endpoints.
    """

    # Request validation API TESTS
    def test_referralreport_requestchange_behavior(self, mock_mailer_send):
        """
        Test
        - Request change can be done by unit granted users on last version
        - A second same change request on a version inactivate the previous request change event
        - Can't request change on a draft, closed or answered referral
        """

        """ Initialize requesters, unit members and referral """
        requester_1 = factories.UserFactory(unit_name='tieps')
        requester_2 = factories.UserFactory(unit_name='tieps')
        unit_member_1 = factories.UserFactory()

        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING, report
        )

        # Set requesters
        referral.users.set([requester_1.id, requester_2.id])

        # Add unit members
        referral.units.get().members.add(unit_member_1)

        # Add unit owner
        unit_owner_1 = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        unit_owner_2 = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        referral.units.get().members.add(unit_owner_1)
        referral.units.get().members.add(unit_owner_2)

        created_referral = models.Referral.objects.get(id=referral.id)
        created_referral.refresh_from_db()

        """
        Send a first version with the unit_member_1 and try to request validation
        with same unit_member_1 (not granted user)
        """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"
        unit_member_1_token = Token.objects.get_or_create(user=unit_member_1)[0]
        unit_owner_token_1 = Token.objects.get_or_create(user=unit_owner_1)[0]
        unit_owner_token_2 = Token.objects.get_or_create(user=unit_owner_2)[0]

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

        # Request change with same unit_member_1
        # FORBIDDEN: only granted users can request change
        unauthorized_request_change = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_change/",
            {
                "comment": "test de demande de changement"
             },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )
        self.assertEqual(unauthorized_request_change.status_code, 403)

        self.assertEqual(mock_mailer_send.call_count, 0)
        # Request change with unit owner
        # AUTHORIZED: done by granted user even before a validation request
        first_authorized_request_change = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_change/",
            {"comment": "blabla owner_1"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_owner_token_1}",
        )
        self.assertEqual(first_authorized_request_change.status_code, 200)

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

        # There is one active request change event
        active_change_request_events = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_CHANGE,
            state=models.ReportEventState.ACTIVE,
        ).count()
        self.assertEqual(active_change_request_events, 1)

        # There is one active request validation event
        active_validation_request_events = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_CHANGE,
            state=models.ReportEventState.ACTIVE,
        ).count()
        self.assertEqual(active_validation_request_events, 1)

        # Send a second request change by the same unit_owner_1
        second_authorized_request_change = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_change/",
            {"comment": "blabla owner_1"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_owner_token_1}",
        )
        self.assertEqual(second_authorized_request_change.status_code, 200)

        # There is only one active request change event
        active_change_request_events = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_CHANGE,
            state=models.ReportEventState.ACTIVE,
        ).count()
        self.assertEqual(active_validation_request_events, 1)

        # There is NO active request validation event
        active_validation_request_events = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_VALIDATION,
            state=models.ReportEventState.ACTIVE,
        ).count()
        self.assertEqual(active_validation_request_events, 0)

        second_authorized_request_change = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_change/",
            {"comment": "blabla owner_2"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_owner_token_2}",
        )
        self.assertEqual(second_authorized_request_change.status_code, 200)

        # There is two active request change event
        active_validation_request_events = models.ReportEvent.objects.filter(
            version__id=first_version_response.json()['id'],
            verb=models.ReportEventVerb.REQUEST_CHANGE,
            state=models.ReportEventState.ACTIVE,
        ).count()
        self.assertEqual(active_validation_request_events, 2)

    def test_referralreport_requestvalidation_state_and_mails(self, mock_mailer_send):
        """
        Test
        - Referral doesn't change its state after request change
        - Mails are sent to assignees only
        """

        # Initialize requesters, unit members and referral
        unit = factories.UnitFactory(name='unit_name')
        unit_member_1 = factories.UserFactory(unit_name=unit.name)

        # Add unit members
        unit.members.add(unit_member_1)

        # Add unit owner
        unit_owner_1 = factories.UserFactory(unit_name=unit.name)
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER,
            unit=unit,
            user=unit_owner_1
        )

        requester_1 = factories.UserFactory(unit_name='tieps')
        requester_2 = factories.UserFactory(unit_name='tieps')

        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING,
            report,
            unit
        )

        # Set requesters
        referral.users.set([requester_1.id, requester_2.id])

        created_referral = models.Referral.objects.get(id=referral.id)
        created_referral.refresh_from_db()

        """
        Send a first version with the unit_member_1 and try to request validation
        with same unit_member_1 (not granted user)
        """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"
        unit_member_1_token = Token.objects.get_or_create(user=unit_member_1)[0]
        unit_owner_token_1 = Token.objects.get_or_create(user=unit_owner_1)[0]

        # Send first version
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {unit_member_1_token}",
        )

        version = models.ReferralReportVersion.objects.get(id=first_version_response.json()['id'])

        self.assertEqual(first_version_response.status_code, 201)

        # Request change with unit owner
        # AUTHORIZED: done by granted user even before a validation request
        first_authorized_request_change = self.client.post(
            f"/api/referralreportversions/{first_version_response.json()['id']}/request_change/",
            {"comment": "blabla owner_1"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_owner_token_1}",
        )
        self.assertEqual(first_authorized_request_change.status_code, 200)
        self.assertEquals(referral.state, models.ReferralState.PROCESSING)

        mailer_send_args = [call[0] for call in mock_mailer_send.call_args_list]

        self.assertTrue(
            get_request_change(
                requester=unit_member_1,
                referral=referral,
                validator=unit_owner_1,
                unit=referral.units.get(),
                version=version
            )
            in mailer_send_args
        )
