# Generated by Django 3.0.5 on 2024-07-04 11:54

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0106_increase_noteobject_length"),
    ]

    operations = [
        migrations.AddField(
            model_name="referral",
            name="satisfaction_survey_participants",
            field=models.ManyToManyField(
                blank=True,
                help_text="Users who answer the survey",
                null=True,
                related_name="referrals_survey_answered",
                to=settings.AUTH_USER_MODEL,
                verbose_name="satisfaction survey participants",
            ),
        ),
        migrations.CreateModel(
            name="ReferralSatisfaction",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Primary key for the referral satisfaction as UUID",
                        primary_key=True,
                        serialize=False,
                        verbose_name="id",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="created at"),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("MEMBER", "referral unit member"),
                            ("OWNER", "referral unit owner"),
                            ("REQUESTER", "referral requester"),
                        ],
                        help_text="User role in the referral",
                        max_length=50,
                        verbose_name="role",
                    ),
                ),
                (
                    "choice",
                    models.CharField(
                        choices=[
                            ("10", "satisfaction happy choice"),
                            ("5", "satisfaction normal choice"),
                            ("0", "satisfaction unhappy choice"),
                        ],
                        help_text="Choice made for the satisfaction request",
                        max_length=50,
                        verbose_name="choice",
                    ),
                ),
                (
                    "type",
                    models.TextField(
                        blank=True,
                        choices=[
                            ("request", "request satisfaction"),
                            ("answer", "answer satisfaction"),
                        ],
                        help_text="type of satisfaction request response",
                        null=True,
                        verbose_name="type",
                    ),
                ),
                (
                    "referral",
                    models.ForeignKey(
                        help_text="Referral on which the satisfaction response was made",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="satisfactions",
                        to="core.Referral",
                        verbose_name="referral",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral satisfaction",
                "db_table": "partaj_referral_satisfaction",
            },
        ),
    ]
