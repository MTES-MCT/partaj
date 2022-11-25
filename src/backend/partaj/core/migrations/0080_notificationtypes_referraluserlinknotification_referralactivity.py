# Generated by Django 3.0.5 on 2022-11-24 10:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0079_referraluserlink_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="referraluserlink",
            name="notifications",
            field=models.CharField(
                choices=[("A", "All"), ("R", "Restricted"), ("N", "None")],
                default="A",
                max_length=1,
            ),
        ),
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("REFERRAL_MESSAGE", "Referral Message"),
                    ("REPORT_MESSAGE_NOTIFICATION", "Report Message"),
                ],
                max_length=48,
            ),
        ),
        migrations.AlterField(
            model_name="referralactivity",
            name="verb",
            field=models.CharField(
                choices=[
                    ("added_requester", "added requester"),
                    ("added_observer", "added observer"),
                    ("answered", "answered"),
                    ("assigned", "assigned"),
                    ("assigned_unit", "assigned unit"),
                    ("closed", "closed"),
                    ("created", "created"),
                    ("draft_answered", "draft answered"),
                    ("removed_requester", "removed requester"),
                    ("removed_observer", "removed observer"),
                    ("unassigned", "unassigned"),
                    ("unassigned_unit", "unassigned unit"),
                    ("urgencylevel_changed", "urgency level changed"),
                    ("validated", "validated"),
                    ("validation_denied", "validation denied"),
                    ("validation_requested", "validation requested"),
                    ("version_added", "version added"),
                ],
                help_text="Verb expressing the action this activity represents",
                max_length=50,
                verbose_name="verb",
            ),
        ),
    ]
