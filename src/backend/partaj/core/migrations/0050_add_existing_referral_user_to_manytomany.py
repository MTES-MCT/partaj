# Generated by Django 3.0.5 on 2021-11-03 15:14

from django.db import migrations


def forwards(apps, schema_editor):
    """
    Copy all existing relations between users and referrals, as defined by the ForeignKey
    on the "user" field, to the new "users" ManyToMany field.
    """
    Referral = apps.get_model("core", "Referral")

    for referral in Referral.objects.all():
        if hasattr(referral, "user"):
            referral.users.add(referral.user)
            referral.save()


def backwards(apps, schema_editor):
    """
    Just delete all user-referral relationships defined through the "users" ManyToMany.
    """
    Referral = apps.get_model("core", "Referral")

    for referral in Referral.objects.all():
        referral.users.clear()
        referral.save()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0049_add_manytomany_referral_user"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=backwards),
    ]
