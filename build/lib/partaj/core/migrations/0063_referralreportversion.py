# Generated by Django 3.0.5 on 2022-06-25 13:24

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0062_referral_reposrt_version_and_version_document"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReferralReportVersion",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Primary key for the report version as UUID",
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
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="updated at"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        help_text="User who created the version",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="created by",
                    ),
                ),
                (
                    "document",
                    models.OneToOneField(
                        blank=True,
                        help_text="The document attached to the report version",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.VersionDocument",
                        verbose_name="report version",
                    ),
                ),
                (
                    "report",
                    models.ForeignKey(
                        help_text="Report the version is linked with",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="core.ReferralReport",
                        verbose_name="report",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral report version",
                "db_table": "partaj_referral_report_version",
            },
        ),
    ]