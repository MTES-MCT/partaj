"""
Defines all receivers in the django app
"""
from django.db import IntegrityError, transaction
from django.dispatch import receiver

from sentry_sdk import capture_message

from partaj.core.email import Mailer
from partaj.core.models import (
    ReferralActivity,
    ReferralActivityVerb,
    ReferralAnswerValidationResponseState,
    ReferralAssignment,
    ReferralState,
    ReferralTopicHistory,
    UnitMembershipRole,
)

from . import signals
from .models import (
    ReferralUserLinkNotificationsTypes,
    ReferralUserLinkRoles,
    ReportEvent,
    ReportEventState,
)
from .services.factories.note_factory import NoteFactory

# pylint: disable=too-many-public-methods


@receiver(signals.requester_added)
def requester_added(sender, referral, requester, created_by, **kwargs):
    """
    Handle actions on referral requester added
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.ADDED_REQUESTER,
        referral=referral,
        item_content_object=requester,
    )
    # Notify the newly added requester by emailing them
    Mailer.send_referral_requester_added(
        referral=referral,
        contact=requester,
        created_by=created_by,
    )


@receiver(signals.requester_deleted)
def requester_deleted(sender, referral, created_by, requester, **kwargs):
    """
    Handle actions on referral requester deleted
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.REMOVED_REQUESTER,
        referral=referral,
        item_content_object=requester,
    )


@receiver(signals.observer_added)
def observer_added(sender, referral, observer, created_by, **kwargs):
    """
    Handle actions on referral observer added
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.ADDED_OBSERVER,
        referral=referral,
        item_content_object=observer,
    )

    if referral.state != ReferralState.DRAFT:
        # Notify the newly added observer by sending them an email
        Mailer.send_referral_observer_added(
            referral=referral,
            contact=observer,
            created_by=created_by,
        )


@receiver(signals.observer_deleted)
def observer_deleted(sender, referral, created_by, observer, **kwargs):
    """
    Handle actions on referral requester deleted
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.REMOVED_OBSERVER,
        referral=referral,
        item_content_object=observer,
    )


@receiver(signals.unit_member_assigned)
def unit_member_assigned(sender, referral, assignee, assignment, created_by, **kwargs):
    """
    Handle actions on unit member assigned to a referral
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.ASSIGNED,
        referral=referral,
        item_content_object=assignee,
    )
    # Notify the assignee by sending them an email
    Mailer.send_referral_assigned(
        referral=referral,
        assignment=assignment,
        assigned_by=created_by,
    )


# pylint: disable=too-many-arguments
@receiver(signals.unit_assigned)
def unit_assigned(
    sender, referral, assignment, created_by, unit, assignunit_explanation, **kwargs
):
    """
    Handle actions on unit assigned to a referral
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.ASSIGNED_UNIT,
        referral=referral,
        item_content_object=unit,
        message=assignunit_explanation,
    )

    Mailer.send_referral_assigned_unit(
        referral=referral,
        assignment=assignment,
        assignunit_explanation=assignunit_explanation,
        assigned_by=created_by,
    )


@receiver(signals.unit_unassigned)
def unit_unassigned(sender, referral, created_by, unit, **kwargs):
    """
    Handle actions on unit unassigned to a referral
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.UNASSIGNED_UNIT,
        referral=referral,
        item_content_object=unit,
    )


@receiver(signals.urgency_level_changed)
def urgency_level_changed(
    sender, referral, created_by, referral_urgencylevel_history, **kwargs
):
    """
    Handle actions on referral urgency level changed
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.URGENCYLEVEL_CHANGED,
        referral=referral,
        item_content_object=referral_urgencylevel_history,
    )

    # Define all users who need to receive emails for this referral
    contacts = [
        *referral.users.filter(
            referraluserlink__role=ReferralUserLinkRoles.REQUESTER,
            referraluserlink__notifications__in=[
                ReferralUserLinkNotificationsTypes.RESTRICTED,
                ReferralUserLinkNotificationsTypes.ALL,
            ],
        ).all()
    ]

    if referral.assignees.count() > 0:
        contacts = contacts + list(referral.assignees.all())
    else:
        for unit in referral.units.all():
            contacts = contacts + [
                membership.user
                for membership in unit.get_memberships().filter(
                    role=UnitMembershipRole.OWNER
                )
            ]

    # Remove the actor from the list of contacts, and use a set to deduplicate entries
    contacts = set(filter(lambda contact: contact.id != created_by.id, contacts))

    for target in contacts:
        Mailer.send_referral_changeurgencylevel(
            contact=target,
            referral=referral,
            history_object=referral_urgencylevel_history,
            created_by=created_by,
        )


@receiver(signals.referral_closed)
def referral_closed(sender, referral, created_by, close_explanation, **kwargs):
    """
    Handle actions on referral closed
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.CLOSED,
        referral=referral,
        message=close_explanation,
    )

    # Update events state from past versions
    ReportEvent.objects.filter(
        report=referral.report, state=ReportEventState.ACTIVE
    ).update(state=ReportEventState.OBSOLETE)

    # Define all users who need to receive emails for this referral
    contacts = [
        *referral.users.filter(
            referraluserlink__role=ReferralUserLinkRoles.REQUESTER,
            referraluserlink__notifications__in=[
                ReferralUserLinkNotificationsTypes.RESTRICTED,
                ReferralUserLinkNotificationsTypes.ALL,
            ],
        ).all()
    ]
    if referral.assignees.count() > 0:
        contacts = contacts + list(referral.assignees.all())
    else:
        for unit in referral.units.all():
            contacts = contacts + [
                membership.user
                for membership in unit.get_memberships().filter(
                    role=UnitMembershipRole.OWNER
                )
            ]

    # Remove the actor from the list of contacts, and use a set to deduplicate entries
    contacts = set(filter(lambda contact: contact.id != created_by.id, contacts))

    for contact in contacts:
        Mailer.send_referral_closed(
            contact=contact,
            referral=referral,
            close_explanation=close_explanation,
            closed_by=created_by,
        )


@receiver(signals.version_added)
def version_added(sender, referral, version, **kwargs):
    """
    Handle actions on referral report version added
    Create a version to the Referral report. If there is no current assignee, we'll auto-assign
    the person who created the version.
    """
    # If the referral is not already assigned, self-assign it to the user who created
    # the first version
    if not ReferralAssignment.objects.filter(referral=referral).exists():
        # Get the first unit from referral linked units the user is a part of.
        # Having a user in two different units both assigned on the same referral is a very
        # specific edge case and picking between those is not an important distinction.
        unit = referral.units.filter(members__id=version.created_by.id).first()
        ReferralAssignment.objects.create(
            assignee=version.created_by,
            created_by=version.created_by,
            referral=referral,
            unit=unit,
        )
        ReferralActivity.objects.create(
            actor=version.created_by,
            verb=ReferralActivityVerb.ASSIGNED,
            referral=referral,
            item_content_object=version.created_by,
        )

    # Update events state from past versions
    ReportEvent.objects.filter(
        report=referral.report, state=ReportEventState.ACTIVE
    ).exclude(version=version).update(state=ReportEventState.OBSOLETE)

    # Create the activity. Everything else was handled upstream where the ReferralVersion
    # instance was created
    ReferralActivity.objects.create(
        actor=version.created_by,
        verb=ReferralActivityVerb.VERSION_ADDED,
        referral=referral,
        item_content_object=version,
    )


@receiver(signals.answer_validation_performed)
def answer_validation_performed(sender, referral, validation_request, state, **kwargs):
    """
    Handle actions on referral answer validation performed
    """
    verb = (
        ReferralActivityVerb.VALIDATED
        if state == ReferralAnswerValidationResponseState.VALIDATED
        else ReferralActivityVerb.VALIDATION_DENIED
    )
    ReferralActivity.objects.create(
        actor=validation_request.validator,
        verb=verb,
        referral=referral,
        item_content_object=validation_request,
    )
    # Notify all the assignees of the validation response with different emails
    # depending on the response state
    assignees = [
        assignment.assignee
        for assignment in ReferralAssignment.objects.filter(referral=referral)
    ]
    Mailer.send_validation_performed(
        validation_request=validation_request,
        assignees=assignees,
        is_validated=state == ReferralAnswerValidationResponseState.VALIDATED,
    )


# pylint: disable=broad-except
@receiver(signals.answer_published)
def answer_published(sender, referral, published_answer, published_by, **kwargs):
    """
    Handle actions on referral answer published
    """
    # Create the publication activity
    ReferralActivity.objects.create(
        actor=published_by,
        verb=ReferralActivityVerb.ANSWERED,
        referral=referral,
        item_content_object=published_answer,
    )

    # Notify the requester by sending them an email
    Mailer.send_referral_answered_to_users(published_by=published_by, referral=referral)

    # Notify the unit owner and assignees by sending them an email
    Mailer.send_referral_answered_to_unit_owners_and_assignees(
        published_by=published_by, referral=referral
    )


@receiver(signals.unit_member_unassigned)
def unit_member_unassigned(sender, referral, created_by, assignee, **kwargs):
    """
    Handle actions on unit member unassigned
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.UNASSIGNED,
        referral=referral,
        item_content_object=assignee,
    )


@receiver(signals.answer_validation_requested)
def answer_validation_requested(
    sender, referral, validation_request, requester, **kwargs
):
    """
    Handle actions on answer validation requested
    """
    activity = ReferralActivity.objects.create(
        actor=requester,
        verb=ReferralActivityVerb.VALIDATION_REQUESTED,
        referral=referral,
        item_content_object=validation_request,
    )
    Mailer.send_validation_requested(
        validation_request=validation_request,
        activity=activity,
    )


@receiver(signals.referral_sent)
def referral_sent(sender, referral, created_by, **kwargs):
    """
    Handle actions on referral sent
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.CREATED,
        referral=referral,
    )
    # Confirm the referral has been sent to the requester by email
    Mailer.send_referral_saved(referral, created_by)

    for observer in referral.get_observers():
        Mailer.send_referral_observer_added(
            referral, contact=observer, created_by=created_by
        )

    # Send this email to all owners of the unit(s) (admins are not supposed to receive
    # email notifications)
    for unit in referral.units.all():
        contacts = unit.members.filter(unitmembership__role=UnitMembershipRole.OWNER)
        for contact in contacts:
            Mailer.send_referral_received(referral, contact=contact, unit=unit)


# pylint: disable=broad-except
@receiver(signals.report_published)
def report_published(sender, referral, version, published_by, **kwargs):
    """
    Handle actions on report published
    """
    # Create the publication activity
    ReferralActivity.objects.create(
        actor=published_by,
        verb=ReferralActivityVerb.ANSWERED,
        referral=referral,
        item_content_object=version,
    )
    # Update events state from past versions
    ReportEvent.objects.filter(
        report=referral.report, state=ReportEventState.ACTIVE
    ).update(state=ReportEventState.OBSOLETE)

    # Notify the requester by sending them an email
    Mailer.send_referral_answered_to_users(published_by=published_by, referral=referral)

    # Notify the unit'owner by sending them an email
    Mailer.send_referral_answered_to_unit_owners_and_assignees(
        published_by=published_by, referral=referral
    )

    # Notify the response sender by sending them an email
    Mailer.send_referral_answered_to_published_by(
        referral=referral, published_by=published_by
    )

    if referral.units.filter(kdb_export=False):
        capture_message(
            f"Note creation skipped : Referral {referral.id} unit's is blacklisted from export",
            "info",
        )

    try:
        with transaction.atomic():
            note = NoteFactory().create_from_referral(referral)
            referral.note = note
            referral.save()
    except IntegrityError:
        capture_message(
            f"An error occured creating note for referral {referral.id} :",
            "error",
        )


@receiver(signals.referral_message_created)
def referral_message_created(sender, referral, referral_message, **kwargs):
    """
    Handle actions on referral message sent
    """
    # Define all users who need to receive emails for this referral
    users = [
        user
        for user in [
            *referral.users.filter(
                referraluserlink__role=ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=ReferralUserLinkNotificationsTypes.ALL,
            ).all()
        ]
        if user != referral_message.user
    ]

    unit_members = []

    if referral.assignees.count() > 0:
        unit_members = unit_members + list(referral.assignees.all())

    for unit in referral.units.all():
        unit_members = unit_members + [
            membership.user
            for membership in unit.get_memberships()
            .filter(role=UnitMembershipRole.OWNER)
            .all()
        ]

    unit_members = set(
        filter(
            lambda unit_member: unit_member.id != referral_message.user.id, unit_members
        )
    )

    # Iterate over targets
    for unit_member in unit_members:
        Mailer.send_new_message_for_unit_member(unit_member, referral, referral_message)

    for user in list(set(users)):
        Mailer.send_new_message_for_requester(user, referral, referral_message)


@receiver(signals.referral_updated_title)
def referral_updated_title(
    sender, referral, created_by, referral_title_history, **kwargs
):
    """
    Handle actions on referral closed
    """

    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.UPDATED_TITLE,
        referral=referral,
        item_content_object=referral_title_history,
    )


@receiver(signals.referral_topic_updated)
def referral_updated_topic(sender, referral, created_by, old_topic, **kwargs):
    """
    Handle actions on referral topic update
    """
    referral_topic_history = ReferralTopicHistory.objects.create(
        referral=referral,
        old_topic=old_topic,
        new_topic=referral.topic,
    )

    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.TOPIC_UPDATED,
        referral=referral,
        item_content_object=referral_topic_history,
    )
