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
    ReferralNoteStatus,
    ReferralState,
    ReferralSubQuestionUpdateHistory,
    ReferralSubTitleUpdateHistory,
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
from .models.subreferral_confirmed_history import SubReferralConfirmedHistory
from .models.subreferral_created_history import SubReferralCreatedHistory
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

    send_to_knowledge_base = False

    for current_unit in referral.units.all():
        if current_unit.kdb_export:
            send_to_knowledge_base = True

    referral.default_send_to_knowledge_base = send_to_knowledge_base
    referral.save()


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

    send_to_knowledge_base = False

    for current_unit in referral.units.all():
        if current_unit.kdb_export:
            send_to_knowledge_base = True

    referral.default_send_to_knowledge_base = send_to_knowledge_base
    referral.save()


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
    contacts = []

    if referral.state not in [
        ReferralState.RECEIVED_SPLITTING,
        ReferralState.SPLITTING,
    ]:
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

    if referral.note:
        referral.note.state = ReferralNoteStatus.TO_DELETE
        referral.note.save()

    # Update events state from past versions
    ReportEvent.objects.filter(
        report=referral.report, state=ReportEventState.ACTIVE
    ).update(state=ReportEventState.OBSOLETE)

    # Define all users who need to receive emails for this referral
    contacts = [
        *referral.users.filter(
            referraluserlink__role__in=[
                ReferralUserLinkRoles.REQUESTER,
                ReferralUserLinkRoles.OBSERVER,
            ],
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


@receiver(signals.appendix_added)
def appendix_added(sender, referral, appendix, **kwargs):
    """
    Handle actions on referral report appendix added
    Create an appendix to the Referral report.
    """
    # Update events state from past versions
    ReportEvent.objects.filter(
        report=referral.report, state=ReportEventState.ACTIVE
    ).exclude(appendix=appendix).update(state=ReportEventState.OBSOLETE)

    # Create the activity. Everything else was handled upstream where the ReferralVersion
    # instance was created
    ReferralActivity.objects.create(
        actor=appendix.created_by,
        verb=ReferralActivityVerb.APPENDIX_ADDED,
        referral=referral,
        item_content_object=appendix,
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
    Handle actions on a unit member unassigned
    """
    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.UNASSIGNED,
        referral=referral,
        item_content_object=assignee,
    )


# pylint: disable=broad-except
@receiver(signals.referral_reopened)
def referral_reopened(
    sender, referral, reopened_by, referral_reopening_history, **kwargs
):
    """
    Handle actions on referral reopened
    """
    activity = ReferralActivity.objects.create(
        actor=reopened_by,
        verb=ReferralActivityVerb.REFERRAL_REOPENED,
        referral=referral,
        item_content_object=referral_reopening_history,
    )

    Mailer.send_referral_reopening_for_experts(
        activity=activity,
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
def report_published(sender, referral, publishment, **kwargs):
    """
    Handle actions on a report published
    """
    # Create the publication activity
    ReferralActivity.objects.create(
        actor=publishment.created_by,
        verb=ReferralActivityVerb.ANSWERED,
        referral=referral,
        item_content_object=publishment.version,
    )
    # Update events state from past versions
    ReportEvent.objects.filter(
        report=referral.report, state=ReportEventState.ACTIVE
    ).update(state=ReportEventState.OBSOLETE)

    if len(referral.report.publishments.all()) > 1:
        # Notify the requester by emailing them
        Mailer.send_new_referral_answered_to_users(
            published_by=publishment.created_by, referral=referral
        )
    else:
        # Notify the requester by emailing them
        Mailer.send_referral_answered_to_users(
            published_by=publishment.created_by, referral=referral
        )

    # Notify the unit owner by emailing them
    Mailer.send_referral_answered_to_unit_owners_and_assignees(
        published_by=publishment.created_by, referral=referral
    )

    # Notify the response sender by emailing them
    Mailer.send_referral_answered_to_published_by(
        referral=referral, published_by=publishment.created_by
    )

    send_to_knowledge_base = referral.override_send_to_knowledge_base

    if send_to_knowledge_base is None:
        send_to_knowledge_base = referral.default_send_to_knowledge_base

    if not send_to_knowledge_base:
        capture_message(
            f"Note creation skipped : Referral {referral.id} is not to be sent to the kdb",
            "info",
        )
        return

    try:
        if referral.note:
            NoteFactory().update_from_referral(referral)
            referral.note.state = ReferralNoteStatus.TO_SEND
            referral.note.save()
        with transaction.atomic():
            note = NoteFactory().create_from_referral(referral)
            referral.note = note
            referral.save()

            referral.update_published_siblings_note()
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


@receiver(signals.split_created)
def split_created(sender, created_by, secondary_referral, **kwargs):
    """
    Handle actions on referral split created
    """
    subreferral_created_history = SubReferralCreatedHistory.objects.create(
        referral=secondary_referral,
        main_referral_id=secondary_referral.get_parent().id,
        secondary_referral_id=secondary_referral.id,
    )

    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.SUBREFERRAL_CREATED,
        referral=secondary_referral,
        item_content_object=subreferral_created_history,
    )


@receiver(signals.subtitle_updated)
def subtitle_updated(sender, created_by, referral, **kwargs):
    """
    Handle actions on referral subtitle update
    """
    referral_subtitle_update_history = ReferralSubTitleUpdateHistory.objects.create(
        referral=referral,
        subtitle=referral.sub_title,
    )

    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.SUBTITLE_UPDATED,
        referral=referral,
        item_content_object=referral_subtitle_update_history,
    )

    # Notify the requester by emailing them if the referral is not in splitting state
    if referral.state not in [
        ReferralState.RECEIVED_SPLITTING,
        ReferralState.SPLITTING,
    ]:
        Mailer.send_referral_subtitle_updated(
            referral=referral,
            created_by=created_by,
            subtitle_update_history=referral_subtitle_update_history,
        )


@receiver(signals.subquestion_updated)
def subquestion_updated(sender, created_by, referral, **kwargs):
    """
    Handle actions on referral subquestion update
    """
    referral_subquestion_update_history = (
        ReferralSubQuestionUpdateHistory.objects.create(
            referral=referral,
            subquestion=referral.sub_question,
        )
    )

    ReferralActivity.objects.create(
        actor=created_by,
        verb=ReferralActivityVerb.SUBQUESTION_UPDATED,
        referral=referral,
        item_content_object=referral_subquestion_update_history,
    )

    # Notify the requester by emailing them if the referral is not in splitting state
    if referral.state not in [
        ReferralState.RECEIVED_SPLITTING,
        ReferralState.SPLITTING,
    ]:
        Mailer.send_referral_subquestion_updated(
            referral=referral,
            created_by=created_by,
            referral_subquestion_update_history=referral_subquestion_update_history,
        )


@receiver(signals.split_confirmed)
def split_confirmed(sender, confirmed_by, secondary_referral, **kwargs):
    """
    Handle actions on referral split confirmed
    """
    subreferral_confirmed_history = SubReferralConfirmedHistory.objects.create(
        referral=secondary_referral,
        main_referral_id=secondary_referral.get_parent().id,
        secondary_referral_id=secondary_referral.id,
    )

    ReferralActivity.objects.create(
        actor=confirmed_by,
        verb=ReferralActivityVerb.SUBREFERRAL_CONFIRMED,
        referral=secondary_referral,
        item_content_object=subreferral_confirmed_history,
    )

    ReferralActivity.objects.create(
        actor=confirmed_by,
        verb=ReferralActivityVerb.SUBREFERRAL_CREATED,
        referral=secondary_referral.get_parent(),
        item_content_object=subreferral_confirmed_history,
    )

    Mailer.send_split_confirmed(
        confirmed_by=confirmed_by,
        secondary_referral=secondary_referral,
    )

    Mailer.send_split_created(
        created_by=confirmed_by,
        secondary_referral=secondary_referral,
    )


@receiver(signals.split_canceled)
def split_canceled(sender, canceled_by, secondary_referral, **kwargs):
    """
    Handle actions on referral split canceled
    """

    Mailer.send_split_canceled(
        canceled_by=canceled_by,
        secondary_referral=secondary_referral,
    )
