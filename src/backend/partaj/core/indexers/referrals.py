"""
Methods and configuration related to the indexing of Referral objects.
"""
from django.conf import settings
from django.contrib.auth import get_user_model

from .. import models
from ..serializers import ReferralLiteSerializer

User = get_user_model()


class ReferralsIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    index_name = f"{settings.ELASTICSEARCH['INDICES_PREFIX']}referrals"
    mapping = {
        "properties": {
            # Role-based filtering fields
            "assignees": {"type": "keyword"},
            "expected_validators": {"type": "keyword"},
            "linked_unit_all_members": {"type": "keyword"},
            "linked_unit_admins": {"type": "keyword"},
            "linked_unit_owners": {"type": "keyword"},
            "linked_unit_owners_and_admins": {"type": "keyword"},
            "users": {"type": "keyword"},
            # Data filtering fields
            "due_date": {"type": "date"},
            "state": {"type": "keyword"},
            "topic": {"type": "keyword"},
            "units": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_referral(cls, referral, index=None, action="index"):
        """Build an Elasticsearch document from the referral instance."""
        index = index or cls.index_name

        # List all users who have an owner or admin role in a unit linked to this referral
        linked_unit_all_members = [
            user.id
            for user in User.objects.filter(
                unitmembership__unit__in=referral.units.all()
            )
        ]
        linked_unit_owners = [
            membership.user.id
            for membership in models.UnitMembership.objects.filter(
                unit__in=referral.units.all(),
                role=models.UnitMembershipRole.OWNER,
            )
        ]
        linked_unit_admins = [
            membership.user.id
            for membership in models.UnitMembership.objects.filter(
                unit__in=referral.units.all(),
                role=models.UnitMembershipRole.ADMIN,
            )
        ]

        expected_validators = [
            validation_request.validator.id
            for validation_request in models.ReferralAnswerValidationRequest.objects.filter(
                answer__referral__id=referral.id,
                response=None,
            )
        ]

        return {
            "_id": referral.id,
            "_index": index,
            "_op_type": action,
            # _source._lite will be used to return serialized referral lites on the API
            # that are identical to what Postgres-based referral lite endpoints returned
            "_lite": ReferralLiteSerializer(referral).data,
            "assignees": [user.id for user in referral.assignees.all()],
            "due_date": referral.get_due_date(),
            "expected_validators": expected_validators,
            "linked_unit_admins": linked_unit_admins,
            "linked_unit_all_members": linked_unit_all_members,
            "linked_unit_owners": linked_unit_owners,
            "linked_unit_owners_and_admins": linked_unit_owners + linked_unit_admins,
            "state": referral.state,
            "topic": referral.topic.id if referral.topic else None,
            "units": [unit.id for unit in referral.units.all()],
            "users": [user.id for user in referral.users.all()],
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the referrals in database and format them for the ElasticSearch index.
        """
        index = index or cls.index_name

        for referral in (
            models.Referral.objects.all()
            .select_related("topic", "urgency_level")
            .prefetch_related("assignees", "units", "user")
        ):
            yield cls.get_es_document_for_referral(referral, index=index, action=action)
