# Generated by Django 3.0.5 on 2020-09-24 12:22

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0028_link_draft_published_answers"),
    ]

    operations = [
        migrations.AlterField(
            model_name="referralactivity",
            name="verb",
            field=models.CharField(
                choices=[
                    ("assigned", "assigned"),
                    ("answered", "answered"),
                    ("draft_answered", "draft answered"),
                    ("created", "created"),
                    ("unassigned", "unassigned"),
                    ("validated", "validated"),
                    ("validation_denied", "validation denied"),
                    ("validation_requested", "validation requested"),
                ],
                help_text="Verb expressing the action this activity represents",
                max_length=50,
                verbose_name="verb",
            ),
        ),
        migrations.CreateModel(
            name="ReferralAnswerValidationRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Primary key for the referral answer validation request as uuid",
                        primary_key=True,
                        serialize=False,
                        verbose_name="id",
                    ),
                ),
                (
                    "answer",
                    models.ForeignKey(
                        help_text="Answer the related user was asked to validate",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="validation_requests",
                        related_query_name="validation_request",
                        to="core.ReferralAnswer",
                        verbose_name="answer",
                    ),
                ),
                (
                    "validator",
                    models.ForeignKey(
                        help_text="User who was asked to validate the related answer",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referral_answer_validation_requests",
                        related_query_name="referral_answer_validation_request",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="validator",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral answer validation request",
                "db_table": "partaj_referral_answer_validation_request",
            },
        ),
    ]
