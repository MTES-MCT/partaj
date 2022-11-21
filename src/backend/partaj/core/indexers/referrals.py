"""
Methods and configuration related to the indexing of Referral objects.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

from .. import models, services
from ..models import ReferralUserLinkRoles
from ..serializers import ReferralLiteSerializer
from .common import partaj_bulk

User = get_user_model()


STATE_TO_NUMBER = {
    models.ReferralState.DRAFT: 7,
    models.ReferralState.RECEIVED: 6,
    models.ReferralState.ASSIGNED: 5,
    models.ReferralState.PROCESSING: 4,
    models.ReferralState.IN_VALIDATION: 3,
    models.ReferralState.ANSWERED: 2,
    models.ReferralState.CLOSED: 1,
}


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
            "users": {"type": "keyword"},
            "observers": {"type": "keyword"},
            # Data and filtering fields
            "case_number": {"type": "integer"},
            "context": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # If we apply trigram on the text query, searching "artificial" will
                        # match "artificial" but also "art" with a lesser score. This is fine
                        # when results are sorted by score but in our case, sorting is a separate
                        # feature which is controlled by users with a simple set of parameters.
                        # For the moment, we consider that using a standard analyzer on the text
                        # query is good enough.
                        "search_analyzer": "french",
                    },
                },
            },
            "due_date": {"type": "date"},
            "object": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # See comment above on trigram field analysis.
                        "search_analyzer": "french",
                    },
                    # Set up a normalized keyword field to be used for sorting
                    "keyword": {"type": "keyword", "normalizer": "keyword_lowercase"},
                },
            },
            "prior_work": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # See comment above on trigram field analysis.
                        "search_analyzer": "french",
                    },
                },
            },
            "question": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # See comment above on trigram field analysis.
                        "search_analyzer": "french",
                    },
                },
            },
            "state": {"type": "keyword"},
            "state_number": {"type": "integer"},
            "topic": {"type": "keyword"},
            "topic_text": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # See comment above on trigram field analysis.
                        "search_analyzer": "french",
                    },
                },
            },
            "published_date": {"type": "date"},
            "units": {"type": "keyword"},
            "users_unit_name": {"type": "keyword"},
            # Lighter fields with textual data used only for sorting purposes
            "assignees_sorting": {"type": "keyword"},
            "users_unit_name_sorting": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_referral(cls, referral, index=None, action="index"):
        """Build an Elasticsearch document from the referral instance."""
        index = index or cls.index_name

        referral_version = services.FeatureFlagService.get_referral_version(referral)
        expected_validators = []
        # If the referral is in referral answer version 2 (referral_report etc..)
        if referral_version:
            if referral.report:
                tmp_expected_validators = []
                validation_requests = (
                    models.ReferralReportValidationRequest.objects.filter(
                        report__id=referral.report.id,
                    )
                )

                for validation_request in validation_requests.iterator():
                    tmp_expected_validators += validation_request.validators.all()

                expected_validators = [
                    expected_validator.id
                    for expected_validator in list(set(tmp_expected_validators))
                ]

                published_date = referral.report.published_at
            else:
                published_date = None
        else:
            expected_validators = [
                validation_request.validator.id
                for validation_request in models.ReferralAnswerValidationRequest.objects.filter(
                    answer__referral__id=referral.id,
                    response=None,
                )
            ]

            try:
                published_date = (
                    models.ReferralAnswer.objects.filter(
                        referral__id=referral.id,
                        state=models.ReferralAnswerState.PUBLISHED,
                    )
                    .latest("created_at")
                    .created_at
                )
            except ObjectDoesNotExist:
                published_date = None

        # Conditionally use the first user in those lists for sorting
        assignees_sorting = referral.assignees.order_by("first_name").first()
        users_unit_name_sorting = referral.users.order_by("unit_name").first()

        return {
            "_id": referral.id,
            "_index": index,
            "_op_type": action,
            # _source._lite will be used to return serialized referral lites on the API
            # that are identical to what Postgres-based referral lite endpoints returned
            "_lite": ReferralLiteSerializer(referral).data,
            "assignees": [user.id for user in referral.assignees.all()],
            "assignees_sorting": assignees_sorting.get_full_name()
            if assignees_sorting
            else "",
            "case_number": referral.id,
            "context": referral.context,
            "due_date": referral.get_due_date(),
            "expected_validators": expected_validators,
            "object": referral.object,
            "prior_work": referral.prior_work,
            "question": referral.question,
            "state": referral.state,
            "state_number": STATE_TO_NUMBER.get(referral.state, 0),
            "topic": referral.topic.id if referral.topic else None,
            "topic_text": referral.topic.name if referral.topic else None,
            "units": [unit.id for unit in referral.units.all()],
            "users": [
                user.id
                for user in referral.users.filter(
                    referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                ).all()
            ],
            "observers": [
                user.id
                for user in referral.users.filter(
                    referraluserlink__role=ReferralUserLinkRoles.OBSERVER
                ).all()
            ],
            "published_date": published_date,
            "users_unit_name": [
                user.unit_name
                for user in referral.users.filter(
                    referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                ).all()
            ],
            "users_unit_name_sorting": users_unit_name_sorting.unit_name
            if users_unit_name_sorting
            else "",
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

    @classmethod
    def update_referral_document(cls, referral):
        """
        Update one document in Elasticsearch, corresponding to one Referral instance.
        """

        action = cls.get_es_document_for_referral(
            referral=referral, index=cls.index_name, action="index"
        )

        # Use bulk to be able to reuse "get_es_document_for_referral" as-is.
        partaj_bulk([action])
