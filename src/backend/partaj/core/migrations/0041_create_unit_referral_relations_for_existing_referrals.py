# Generated by Django 3.0.5 on 2021-02-04 14:00

from django.db import migrations


def forwards(apps, schema_editor):
    """
    As we create a ManyToMany between referrals & units, we need to create relations for existing
    referrals. We do not intend to use the referral => topic => unit relation anymore.
    """
    Referral = apps.get_model("core", "Referral")

    for referral in Referral.objects.all():
        referral.units.add(referral.topic.unit)
        referral.save()


def backwards(apps, schema_editor):
    """
    As the ManyToMany relationship between units & referrals is created in 0040, we do not need
    to do anything as all existing relations will disappear along with the relationship.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0040_create_manytomany_referrals_units"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=backwards),
    ]
