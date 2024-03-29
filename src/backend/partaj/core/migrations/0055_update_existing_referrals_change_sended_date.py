# Generated by Django 3.0.5 on 2021-09-08 12:24

from django.db import migrations
from django.db.models import Q

from partaj.core.models import ReferralState


def forwards(apps, schema_editor):
    """
    We just added a sent date on referrals.
    We need to fill the sent date with created date for all referrals not in Draft state.
    """
    Referral = apps.get_model("core", "Referral")

    for referral in Referral.objects.exclude(state=ReferralState.DRAFT):
        referral.sent_at = referral.created_at
        referral.save()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0054_add_sentat_referral"),
    ]

    operations = [
        migrations.RunPython(forwards),
    ]
