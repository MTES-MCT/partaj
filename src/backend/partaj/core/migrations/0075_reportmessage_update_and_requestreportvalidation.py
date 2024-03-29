# Generated by Django 3.0.5 on 2022-10-11 15:33

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0074_referralreportversion_createdat"),
    ]

    operations = [
        migrations.AddField(
            model_name="reportmessage",
            name="item_content_type",
            field=models.ForeignKey(
                blank=True,
                help_text="Model for the linked item",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="contenttypes.ContentType",
                verbose_name="item content type",
            ),
        ),
        migrations.AddField(
            model_name="reportmessage",
            name="item_object_id",
            field=models.CharField(
                blank=True,
                help_text="ID of the linked item",
                max_length=255,
                null=True,
                verbose_name="item object id",
            ),
        ),
        migrations.AddField(
            model_name="reportmessage",
            name="verb",
            field=models.CharField(
                choices=[
                    ("message", "report message"),
                    ("validation", "report validation"),
                ],
                default="message",
                help_text="Verb expressing the action this activity represents",
                max_length=50,
                verbose_name="verb",
            ),
        ),
        migrations.CreateModel(
            name="ReferralReportValidationRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Primary key for the referral report validation request as uuid",
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
                    "asker",
                    models.ForeignKey(
                        help_text="User who asked for report validation",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referral_report_validation_requests",
                        related_query_name="referral_report_validation_request",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="asker",
                    ),
                ),
                (
                    "report",
                    models.ForeignKey(
                        blank=True,
                        help_text="Report the related user was asked to validate",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="validation_requests",
                        related_query_name="validation_request",
                        to="core.ReferralReport",
                        verbose_name="report",
                    ),
                ),
                (
                    "validators",
                    models.ManyToManyField(
                        help_text="Users who was asked to validate the related report",
                        related_name="referral_report_validations",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="validator",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral report validation request",
                "db_table": "partaj_referral_report_validation_request",
            },
        ),
    ]
