# Generated by Django 3.0.5 on 2022-07-12 10:50

import uuid

import django.db.models.deletion
from django.db import migrations, models

import partaj.core.models.attachment


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0068_rename_version_document_table"),
    ]

    operations = [
        migrations.AddField(
            model_name="referralreport",
            name="final_version",
            field=models.OneToOneField(
                blank=True,
                help_text="The published referral report version",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="core.ReferralReportVersion",
                verbose_name="final published version",
            ),
        ),
        migrations.AddField(
            model_name="referralreport",
            name="published_at",
            field=models.DateTimeField(
                blank=True, null=True, verbose_name="published at"
            ),
        ),
        migrations.CreateModel(
            name="ReferralReportAttachment",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Primary key for the attachment as UUID",
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
                    "file",
                    models.FileField(
                        upload_to=partaj.core.models.attachment.attachment_upload_to,
                        verbose_name="file",
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        blank=True,
                        help_text="Name for the attachment, defaults to file name",
                        max_length=200,
                        verbose_name="name",
                    ),
                ),
                (
                    "size",
                    models.IntegerField(
                        blank=True,
                        help_text="Attachment file size in bytes",
                        null=True,
                        verbose_name="file size",
                    ),
                ),
                (
                    "report",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attachments",
                        to="core.ReferralReport",
                        verbose_name="referral report attachments",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral report attachment",
                "db_table": "partaj_referral_report_attachment",
            },
        ),
    ]
