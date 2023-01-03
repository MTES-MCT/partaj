# Generated by Django 3.0.5 on 2022-10-24 13:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0076_referral_answer_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="status",
            field=models.CharField(
                choices=[("A", "Active"), ("I", "Inactive")], default="A", max_length=1
            ),
        ),
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("REPORT_MESSAGE_NOTIFICATION", "Report Message"),
                    ("REFERRAL_REQUESTER_ADDED", "Referral Requester Added"),
                    ("REFERRAL_UNIT_MEMBER_ASSIGNED", "Referral Unit Member Assigned"),
                    ("REFERRAL_UNIT_ASSIGNED", "Referral Unit Assigned"),
                    ("REFERRAL_UNIT_UNASSIGNED", "Referral Unit Unassigned"),
                    (
                        "REFERRAL_URGENCY_LEVEL_CHANGED",
                        "Referral Urgency Level Changed",
                    ),
                    ("REFERRAL_CLOSED", "Referral Closed"),
                    ("REPORT_VERSION_ADDED", "Report Version Added"),
                    (
                        "REFERRAL_ANSWER_VALIDATION_PERFORMED",
                        "Referral Answer Validation Performed",
                    ),
                    ("REFERRAL_ANSWER_PUBLISHED", "Referral Answer Published"),
                    ("REFERRAL_REQUESTER_DELETED", "Referral Requester Deleted"),
                    (
                        "REFERRAL_UNIT_MEMBER_UNASSIGNED",
                        "Referral Unit Member Unassigned",
                    ),
                    (
                        "REFERRAL_ANSWER_VALIDATION_REQUESTED",
                        "Referral Answer Validation Requested",
                    ),
                    ("REFERRAL_SENT", "Referral Sent"),
                    ("REPORT_PUBLISHED", "Report Published"),
                ],
                max_length=48,
            ),
        ),
        migrations.AlterField(
            model_name="notification",
            name="preview",
            field=models.TextField(
                blank=True,
                help_text="Text content to display into the notification",
                null=True,
                verbose_name="preview",
            ),
        ),
    ]