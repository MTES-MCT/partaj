from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralApiTestCase(TestCase):
    """
    Test API routes related to ReferralActivity endpoints.
    """

    # LIST TESTS
    def test_list_referralactivity_by_anonymous_user(self):
        """
        Anonymous users cannot make list requests on referral activity.
        """
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        response = self.client.get(
            f"/api/referralactivities/?referral={create_activity.referral.id}"
        )
        self.assertEqual(response.status_code, 401)

    def test_list_referralactivity_by_random_logged_in_user(self):
        """
        Random logged in users cannot make list requests on referral activity for a referral
        with which they have no link.
        """
        user = factories.UserFactory()
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        response = self.client.get(
            f"/api/referralactivities/?referral={create_activity.referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referralactivity_by_referral_linked_unit_member(self):
        """
        The relevant referral's linked unit members can make list requests on referral activity,
        and they get to see all types of activities.
        """
        user = factories.UserFactory()
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        create_activity.referral.units.get().members.add(user)
        rest_activities = {
            verb: factories.ReferralActivityFactory(
                referral=create_activity.referral, verb=verb
            )
            for verb in [
                # 10 kinds of activities shown to requesters (including CREATED)
                models.ReferralActivityVerb.ADDED_REQUESTER,
                models.ReferralActivityVerb.ANSWERED,
                models.ReferralActivityVerb.ASSIGNED,
                models.ReferralActivityVerb.ASSIGNED_UNIT,
                models.ReferralActivityVerb.CLOSED,
                models.ReferralActivityVerb.REMOVED_REQUESTER,
                models.ReferralActivityVerb.UNASSIGNED,
                models.ReferralActivityVerb.UNASSIGNED_UNIT,
                models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
                # 4 kinds of activities not shown to requesters
                models.ReferralActivityVerb.DRAFT_ANSWERED,
                models.ReferralActivityVerb.VALIDATED,
                models.ReferralActivityVerb.VALIDATION_DENIED,
                models.ReferralActivityVerb.VALIDATION_REQUESTED,
            ]
        }

        response = self.client.get(
            f"/api/referralactivities/?referral={create_activity.referral.id}&limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 14)
        results = response.json()["results"]
        # The CREATED activity has no associated object
        self.assertEqual(results[0]["verb"], models.ReferralActivityVerb.CREATED)
        self.assertEqual(results[0]["item_content_object"], None)
        # The ADDED_REQUESTER activity is associated with a user
        self.assertEqual(
            results[1]["verb"], models.ReferralActivityVerb.ADDED_REQUESTER
        )
        self.assertEqual(
            results[1]["item_content_object"]["username"],
            rest_activities[
                models.ReferralActivityVerb.ADDED_REQUESTER
            ].item_content_object.username,
        )
        # The ANSWERED activity is associated with a referral answer
        self.assertEqual(results[2]["verb"], models.ReferralActivityVerb.ANSWERED)
        self.assertEqual(
            results[2]["item_content_object"]["id"],
            str(
                rest_activities[
                    models.ReferralActivityVerb.ANSWERED
                ].item_content_object.id
            ),
        )
        # The ASSIGNED activity is associated with a user
        self.assertEqual(results[3]["verb"], models.ReferralActivityVerb.ASSIGNED)
        self.assertEqual(
            results[3]["item_content_object"]["username"],
            rest_activities[
                models.ReferralActivityVerb.ASSIGNED
            ].item_content_object.username,
        )
        # The ASSIGNED_UNIT activity is associated with a unit and has a linked message
        self.assertEqual(results[4]["verb"], models.ReferralActivityVerb.ASSIGNED_UNIT)
        self.assertEqual(
            results[4]["message"],
            rest_activities[models.ReferralActivityVerb.ASSIGNED_UNIT].message,
        )
        self.assertEqual(
            results[4]["item_content_object"]["name"],
            rest_activities[
                models.ReferralActivityVerb.ASSIGNED_UNIT
            ].item_content_object.name,
        )
        # The CLOSED activity has no associated object but has a linked message
        self.assertEqual(results[5]["verb"], models.ReferralActivityVerb.CLOSED)
        self.assertEqual(
            results[5]["message"],
            rest_activities[models.ReferralActivityVerb.CLOSED].message,
        )
        self.assertEqual(
            results[5]["item_content_object"],
            None,
        )
        # The REMOVED_REQUESTER activity is associated with a user
        self.assertEqual(
            results[6]["verb"], models.ReferralActivityVerb.REMOVED_REQUESTER
        )
        self.assertEqual(
            results[6]["item_content_object"]["username"],
            rest_activities[
                models.ReferralActivityVerb.REMOVED_REQUESTER
            ].item_content_object.username,
        )
        # The UNASSIGNED activity is associated with a user
        self.assertEqual(results[7]["verb"], models.ReferralActivityVerb.UNASSIGNED)
        self.assertEqual(
            results[7]["item_content_object"]["username"],
            rest_activities[
                models.ReferralActivityVerb.UNASSIGNED
            ].item_content_object.username,
        )
        # The UNASSIGNED_UNIT activity is associated with a unit
        self.assertEqual(
            results[8]["verb"], models.ReferralActivityVerb.UNASSIGNED_UNIT
        )
        self.assertEqual(
            results[8]["item_content_object"]["name"],
            rest_activities[
                models.ReferralActivityVerb.UNASSIGNED_UNIT
            ].item_content_object.name,
        )
        # The URGENCYLEVEL_CHANGED activity is associated with an urgency level history instance
        self.assertEqual(
            results[9]["verb"], models.ReferralActivityVerb.URGENCYLEVEL_CHANGED
        )
        self.assertEqual(
            results[9]["item_content_object"]["id"],
            str(
                rest_activities[
                    models.ReferralActivityVerb.URGENCYLEVEL_CHANGED
                ].item_content_object.id
            ),
        )
        # The DRAFT_ANSWERED activity is associated with a referral answer
        self.assertEqual(
            results[10]["verb"], models.ReferralActivityVerb.DRAFT_ANSWERED
        )
        self.assertEqual(
            results[10]["item_content_object"]["id"],
            str(
                rest_activities[
                    models.ReferralActivityVerb.DRAFT_ANSWERED
                ].item_content_object.id
            ),
        )
        # The VALIDATED activity is associated with a referral answer validation response
        self.assertEqual(results[11]["verb"], models.ReferralActivityVerb.VALIDATED)
        self.assertEqual(
            results[11]["item_content_object"]["id"],
            str(
                rest_activities[
                    models.ReferralActivityVerb.VALIDATED
                ].item_content_object.id
            ),
        )
        # The VALIDATION_DENIED activity is associated with a referral answer validation response
        self.assertEqual(
            results[12]["verb"], models.ReferralActivityVerb.VALIDATION_DENIED
        )
        self.assertEqual(
            results[12]["item_content_object"]["id"],
            str(
                rest_activities[
                    models.ReferralActivityVerb.VALIDATION_DENIED
                ].item_content_object.id
            ),
        )
        # The VALIDATION_REQUESTED activity is associated with a referral answer validation request
        self.assertEqual(
            results[13]["verb"], models.ReferralActivityVerb.VALIDATION_REQUESTED
        )
        self.assertEqual(
            results[13]["item_content_object"]["id"],
            str(
                rest_activities[
                    models.ReferralActivityVerb.VALIDATION_REQUESTED
                ].item_content_object.id
            ),
        )

    def test_list_referralactivity_by_referral_linked_user(self):
        """
        The relevant referral's linked user can make list requests on referral activity.
        However, they can only see some of the types of activities that exist.
        """
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        for verb in [
            # 10 kinds of activities shown to requesters (including CREATED)
            models.ReferralActivityVerb.ADDED_REQUESTER,
            models.ReferralActivityVerb.ANSWERED,
            models.ReferralActivityVerb.ASSIGNED,
            models.ReferralActivityVerb.ASSIGNED_UNIT,
            models.ReferralActivityVerb.CLOSED,
            models.ReferralActivityVerb.REMOVED_REQUESTER,
            models.ReferralActivityVerb.UNASSIGNED,
            models.ReferralActivityVerb.UNASSIGNED_UNIT,
            models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
            # 4 kinds of activities not shown to requesters
            models.ReferralActivityVerb.DRAFT_ANSWERED,
            models.ReferralActivityVerb.VALIDATED,
            models.ReferralActivityVerb.VALIDATION_DENIED,
            models.ReferralActivityVerb.VALIDATION_REQUESTED,
        ]:
            factories.ReferralActivityFactory(
                referral=create_activity.referral, verb=verb
            )
        self.assertEqual(models.ReferralActivity.objects.count(), 14)

        user = create_activity.referral.users.first()
        response = self.client.get(
            f"/api/referralactivities/?referral={create_activity.referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 10)
        results = response.json()["results"]
        self.assertEqual(results[0]["verb"], models.ReferralActivityVerb.CREATED)
        self.assertEqual(
            results[1]["verb"], models.ReferralActivityVerb.ADDED_REQUESTER
        )
        self.assertEqual(results[2]["verb"], models.ReferralActivityVerb.ANSWERED)
        self.assertEqual(results[3]["verb"], models.ReferralActivityVerb.ASSIGNED)
        self.assertEqual(results[4]["verb"], models.ReferralActivityVerb.ASSIGNED_UNIT)
        self.assertEqual(results[5]["verb"], models.ReferralActivityVerb.CLOSED)
        self.assertEqual(
            results[6]["verb"], models.ReferralActivityVerb.REMOVED_REQUESTER
        )
        self.assertEqual(results[7]["verb"], models.ReferralActivityVerb.UNASSIGNED)
        self.assertEqual(
            results[8]["verb"], models.ReferralActivityVerb.UNASSIGNED_UNIT
        )
        self.assertEqual(
            results[9]["verb"], models.ReferralActivityVerb.URGENCYLEVEL_CHANGED
        )

    def test_list_referralactivity_by_referral_linked_user_also_unit_member(self):
        """
        If a given user is both the referral linked user and a linked unit member, they get to
        see all types of activity.
        """
        user = factories.UserFactory()
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        create_activity.referral.units.get().members.add(user)
        create_activity.referral.user = user
        create_activity.referral.save()

        for verb in [
            # 10 kinds of activities shown to requesters (including CREATED)
            models.ReferralActivityVerb.ADDED_REQUESTER,
            models.ReferralActivityVerb.ANSWERED,
            models.ReferralActivityVerb.ASSIGNED,
            models.ReferralActivityVerb.ASSIGNED_UNIT,
            models.ReferralActivityVerb.CLOSED,
            models.ReferralActivityVerb.REMOVED_REQUESTER,
            models.ReferralActivityVerb.UNASSIGNED,
            models.ReferralActivityVerb.UNASSIGNED_UNIT,
            models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
            # 4 kinds of activities not shown to requesters
            models.ReferralActivityVerb.DRAFT_ANSWERED,
            models.ReferralActivityVerb.VALIDATED,
            models.ReferralActivityVerb.VALIDATION_DENIED,
            models.ReferralActivityVerb.VALIDATION_REQUESTED,
        ]:
            factories.ReferralActivityFactory(
                referral=create_activity.referral, verb=verb
            )

        response = self.client.get(
            f"/api/referralactivities/?referral={create_activity.referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 14)

    def test_list_referralactivity_by_admin_user(self):
        """
        Admin users can make list requests on referral activity, and they get to see
        all types of activities.
        """
        user = factories.UserFactory(is_staff=True)
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        for verb in [
            # 10 kinds of activities shown to requesters (including CREATED)
            models.ReferralActivityVerb.ADDED_REQUESTER,
            models.ReferralActivityVerb.ANSWERED,
            models.ReferralActivityVerb.ASSIGNED,
            models.ReferralActivityVerb.ASSIGNED_UNIT,
            models.ReferralActivityVerb.CLOSED,
            models.ReferralActivityVerb.REMOVED_REQUESTER,
            models.ReferralActivityVerb.UNASSIGNED,
            models.ReferralActivityVerb.UNASSIGNED_UNIT,
            models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
            # 4 kinds of activities not shown to requesters
            models.ReferralActivityVerb.DRAFT_ANSWERED,
            models.ReferralActivityVerb.VALIDATED,
            models.ReferralActivityVerb.VALIDATION_DENIED,
            models.ReferralActivityVerb.VALIDATION_REQUESTED,
        ]:
            factories.ReferralActivityFactory(
                referral=create_activity.referral, verb=verb
            )

        response = self.client.get(
            f"/api/referralactivities/?referral={create_activity.referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 14)

    def test_list_referralactivity_missing_referral_param(self):
        """
        When a user makes a request without the referral parameter, even if there exist referral
        activities for which they could make a request, the get an error code.
        The API does not support generic requests.
        """
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        user = create_activity.referral.users.first()
        response = self.client.get(
            "/api/referralactivities/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["ReferralActivity list requests need a referral parameter"]},
        )

    def test_list_referralactivity_for_nonexistent_referral(self):
        """
        Requests must reference an existing referral. Make sure we return the expected error
        for requests that do not.
        """
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        user = create_activity.referral.users.first()
        response = self.client.get(
            "/api/referralactivities/?referral=2984524",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "ReferralActivity list requests must reference an existing referral"
                ]
            },
        )

    # RETRIEVE TESTS
    def test_retrieve_referralactivity_by_anonymous_user(self):
        """
        Retrieve endpoint for referral activity is not implemented. Anonymous users are
        still disallowed by the API permission.
        """
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        response = self.client.get(f"/api/referralactivities/{create_activity.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_referralactivity_by_random_logged_in_user(self):
        """
        Retrieve endpoint for referral activity is not implemented.
        """
        user = factories.UserFactory()
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        response = self.client.get(
            f"/api/referralactivities/{create_activity.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

    def test_retrieve_referralactivity_by_referral_linked_user(self):
        """
        Retrieve endpoint for referral activity is not implemented.
        """
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        user = create_activity.referral.users.first()
        response = self.client.get(
            f"/api/referralactivities/{create_activity.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

    def test_retrieve_referralactivity_by_referral_linked_unit_member(self):
        """
        Retrieve endpoint for referral activity is not implemented.
        """
        user = factories.UserFactory()
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        create_activity.referral.units.get().members.add(user)
        response = self.client.get(
            f"/api/referralactivities/{create_activity.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

    def test_retrieve_referralactivity_by_admin_user(self):
        """
        Retrieve endpoint for referral activity is not implemented.
        """
        user = factories.UserFactory(is_staff=True)
        create_activity = factories.ReferralActivityFactory(
            verb=models.ReferralActivityVerb.CREATED
        )
        response = self.client.get(
            f"/api/referralactivities/{create_activity.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
