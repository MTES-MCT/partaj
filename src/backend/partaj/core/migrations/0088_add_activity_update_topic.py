# Generated by Django 3.0.5 on 2023-05-12 09:38

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0087_add_activity_update_title"),
    ]

    operations = [
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
                    ("updated_title", "updated title"),
                    ("updated_topic", "updated topic"),
                ],
                help_text="Verb expressing the action this activity represents",
                max_length=50,
                verbose_name="verb",
            ),
        ),
        migrations.CreateModel(
            name="ReferralTopicHistory",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Primary key for the referral topic history as UUID",
                        primary_key=True,
                        serialize=False,
                        verbose_name="id",
                    ),
                ),
                (
                    "old_topic",
                    models.TextField(
                        help_text="old referral's topic", verbose_name="old topic"
                    ),
                ),
                (
                    "new_topic",
                    models.TextField(
                        help_text="new referral's topic", verbose_name="new topic"
                    ),
                ),
                (
                    "referral",
                    models.ForeignKey(
                        help_text="Referral subject to the topic change",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referral_topic_history",
                        to="core.Referral",
                        verbose_name="referral",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral topic history",
                "db_table": "partaj_referral_topic_history",
            },
        ),
    ]
