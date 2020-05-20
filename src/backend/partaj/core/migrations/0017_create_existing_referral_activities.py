# Generated by Django 3.0.5 on 2020-05-20 13:25

from django.db import migrations
from django.db.models import Q

from partaj.core.models import (
    Referral,
    ReferralActivity,
    ReferralActivityVerb,
    ReferralAnswer,
    ReferralAssignment,
)


def forwards(apps, schema_editor):
    """
    For each Referral, create a ReferralActivity objects representing events that have
    already occurred and which we can infer by its current state.
    """
    for referral in Referral.objects.all():
        activity = ReferralActivity.objects.create(
            actor=referral.user, referral=referral, verb=ReferralActivityVerb.CREATED,
        )
        activity.created_at = referral.created_at
        activity.save()

    for referral_answer in ReferralAnswer.objects.all():
        activity = ReferralActivity.objects.create(
            actor=referral_answer.created_by,
            item_content_object=referral_answer,
            referral=referral_answer.referral,
            verb=ReferralActivityVerb.ANSWERED,
        )
        activity.created_at = referral_answer.created_at
        activity.save()

    for referral_assignment in ReferralAssignment.objects.all():
        activity = ReferralActivity.objects.create(
            actor=referral_assignment.created_by,
            item_content_object=referral_assignment.assignee,
            referral=referral_assignment.referral,
            verb=ReferralActivityVerb.ASSIGNED,
        )
        activity.created_at = referral_assignment.created_at
        activity.save()


def backwards(apps, schema_editor):
    """
    Remove all ReferralActivity objects representing referral creations. They can be regenerated
    by the forwards migration.
    """
    ReferralActivity.objects.filter(
        Q(verb=ReferralActivityVerb.ANSWERED)
        | Q(verb=ReferralActivityVerb.ASSIGNED)
        | Q(verb=ReferralActivityVerb.CREATED)
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0016_add_referral_activity"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=backwards),
    ]
