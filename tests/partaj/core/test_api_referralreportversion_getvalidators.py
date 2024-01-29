from io import BytesIO

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from utils.mock_referral import mock_create_referral


class ReferralReportVersionGetValidators(TestCase):
    """
    Test API routes related to ReferralReportVersion validation endpoints.
    """

    # Request validation API TESTS
    def test_referralreport_getvalidators_by_member(self):
        """
        Test
        - Validation request can be done by its author on last version
        - A second same validation request  on a version inactivate last validationrequest
        - Can't request validation on a draft, closed or answered referral
        - Referral changes its state to IN_VALIDATION at the first validation request
        - Mails are sent to unit owner from the specified unit
        """

        """ Initialize requesters, unit members and referral """
        unit = factories.UnitFactory(name='coucou')

        requester_1 = factories.UserFactory(unit_name='toto')
        requester_2 = factories.UserFactory(unit_name='toto')
        unit_member_1 = factories.UserFactory(unit_name='coucou')
        unit_member_2 = factories.UserFactory(unit_name='coucou')
        unit_owner = factories.UserFactory(unit_name='coucou')
        unit_admin = factories.UserFactory(unit_name='coucou')
        unit_superadmin = factories.UserFactory(unit_name='coucou')

        # Create memberships
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER,
            unit=unit,
            user=unit_member_1
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER,
            unit=unit,
            user=unit_member_2
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER,
            unit=unit,
            user=unit_owner
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN,
            unit=unit,
            user=unit_admin,
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.SUPERADMIN,
            unit=unit,
            user=unit_superadmin,
        )

        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            unit=unit,
            state=models.ReferralState.PROCESSING,
            report=report
        )

        referral.refresh_from_db()

        # Set requesters
        referral.users.set([requester_1.id, requester_2.id])

        created_referral = models.Referral.objects.get(id=referral.id)
        created_referral.refresh_from_db()

        """
        Send a first version with the unit_member_1 and try to request validation
        with different unit members
        """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name.doc"
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

        # Get validators for a member
        # It returns only validators with an upper role
        member_getvalidators_response = self.client.get(
            f"/api/referralreportversions/{first_version_response.json()['id']}/get_validators/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_member_2_token}",
        )

        self.assertEqual(member_getvalidators_response.json()["owner"]["coucou"], [unit_owner.get_full_name()])
        self.assertEqual(member_getvalidators_response.json()["admin"]["coucou"], [unit_admin.get_full_name()])
        self.assertEqual(member_getvalidators_response.json()["superadmin"]["coucou"], [unit_superadmin.get_full_name()])

    def test_referralreport_getvalidators_by_admin(self):
        """
        Test
        - Validation request can be done by its author on last version
        - A second same validation request  on a version inactivate last validationrequest
        - Can't request validation on a draft, closed or answered referral
        - Referral changes its state to IN_VALIDATION at the first validation request
        - Mails are sent to unit owner from the specified unit
        """

        """ Initialize requesters, unit members and referral """
        unit = factories.UnitFactory(name='tieps')

        requester_1 = factories.UserFactory(unit_name='pouet')
        requester_2 = factories.UserFactory(unit_name='pouet')
        unit_member_1 = factories.UserFactory(unit_name='tieps')
        unit_member_2 = factories.UserFactory(unit_name='tieps')
        unit_owner = factories.UserFactory(unit_name='tieps')
        unit_admin = factories.UserFactory(unit_name='tieps')
        unit_superadmin = factories.UserFactory(unit_name='tieps')

        # Create memberships
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER,
            unit=unit,
            user=unit_member_1
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER,
            unit=unit,
            user=unit_member_2
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER,
            unit=unit,
            user=unit_owner
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN,
            unit=unit,
            user=unit_admin,
        )

        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.SUPERADMIN,
            unit=unit,
            user=unit_superadmin,
        )

        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            unit=unit,
            state=models.ReferralState.PROCESSING,
            report=report
        )

        referral.refresh_from_db()

        # Set requesters
        referral.users.set([requester_1.id, requester_2.id])

        created_referral = models.Referral.objects.get(id=referral.id)
        created_referral.refresh_from_db()

        """
        Send a first version with the unit_member_1 and try to request validation
        with different unit members
        """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name.doc"
        unit_member_1_token = Token.objects.get_or_create(user=unit_member_1)[0]
        unit_admin_token = Token.objects.get_or_create(user=unit_admin)[0]

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

        # Get validators with an admin
        # It returns only validators with an upper role
        admin_getvalidators_response = self.client.get(
            f"/api/referralreportversions/{first_version_response.json()['id']}/get_validators/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {unit_admin_token}",
        )
        self.assertFalse("owner" in admin_getvalidators_response.json())
        self.assertFalse("admin" in admin_getvalidators_response.json())
        self.assertTrue("superadmin" in admin_getvalidators_response.json())
        self.assertEqual(admin_getvalidators_response.json()["superadmin"]["tieps"], [unit_superadmin.get_full_name()])
