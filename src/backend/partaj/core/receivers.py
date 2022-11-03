"""
Defines all receivers in the django app
"""
from django.dispatch import receiver

from sentry_sdk import capture_exception, capture_message

from partaj.core.email import Mailer
from partaj.core.models import (
    ReferralActivity,
    ReferralActivityVerb,
    ReferralAnswerValidationResponseState,
    ReferralAssignment,
    UnitMembershipRole,
)

from . import services, signals
from .models import Notification, NotificationStatus, NotificationTypes
from .requests.note_api_request import NoteApiRequest


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
    # Notify the newly added requester by sending them an email
    Mailer.send_referral_requester_added(
        referral=referral,
        contact=requester,
        created_by=created_by,
    )


@receiver(signals.follower_added)
def follower_added(sender, referral, follower, **kwargs):
    """
    Handle actions on referral requester added
    """
    Notification.objects.create(
        notified=follower,
        status=NotificationStatus.INACTIVE,
        notification_type=NotificationTypes.REPORT_MESSAGE,
        item_content_object=referral,
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
    contacts = [*referral.users.all()]
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

    # Define all users who need to receive emails for this referral
    contacts = [*referral.users.all()]
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
    Create a draft answer to the Referral. If there is no current assignee, we'll auto-assign
    the person who created the draft.
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

    # Notify the unit owner by sending them an email
    Mailer.send_referral_answered_to_unit_owners(
        published_by=published_by, referral=referral
    )

    if services.FeatureFlagService.get_referral_version(referral) == 0:
        try:
            api_note_request = NoteApiRequest()
            api_note_request.post_note(published_answer)
        except ValueError as value_error_exception:
            for message in value_error_exception.args:
                capture_message(message)
        except Exception as exception:
            capture_exception(exception)


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

    # Notify the requester by sending them an email
    Mailer.send_referral_answered_to_users(published_by=published_by, referral=referral)

    # Notify the unit'owner by sending them an email
    Mailer.send_referral_answered_to_unit_owners(
        published_by=published_by, referral=referral
    )

    if services.FeatureFlagService.get_referral_version(referral) == 1:
        try:
            api_note_request = NoteApiRequest()
            api_note_request.post_note_new_answer_version(referral)
        except ValueError as value_error_exception:
            for message in value_error_exception.args:
                capture_message(message)
        except Exception as exception:
            capture_exception(exception)


@receiver(signals.referral_message_created)
def referral_message_created(sender, referral, referral_message, **kwargs):
    """
    Handle actions on referral message sent
    """
    # Define all users who need to receive emails for this referral
    targets = [*referral.users.all()]
    if referral.assignees.count() > 0:
        targets = targets + list(referral.assignees.all())
    else:
        for unit in referral.units.all():
            targets = targets + [
                membership.user
                for membership in unit.get_memberships().filter(
                    role=UnitMembershipRole.OWNER
                )
            ]

    notifications = referral.notifications.filter(
        notification_type=NotificationTypes.REFERRAL_MESSAGE
    ).all()

    users_to_remove = [
        notification.notified
        for notification in notifications
        if notification.status == NotificationStatus.INACTIVE
    ]

    users_to_add = [
        notification.notified
        for notification in notifications
        if notification.status == NotificationStatus.ACTIVE
    ]

    # The user who sent the message should not receive an email
    targets = [
        target
        for target in targets
        if target != referral_message.user and target not in users_to_remove
    ]
    targets = targets + users_to_add
    targets = list(set(targets))

    # Iterate over targets
    for target in targets:
        if target in referral.users.all():
            Mailer.send_new_message_for_requesters(referral, referral_message)
        else:
            Mailer.send_new_message_for_unit_member(target, referral, referral_message)