# Generated by Django 3.0.5 on 2023-05-14 12:37

from django.db import migrations, models

import django_fsm


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0087_add_activity_update_title"),
    ]

    operations = [
        migrations.AddField(
            model_name="referralnote",
            name="state",
            field=django_fsm.FSMField(
                choices=[
                    ("received", "Received"),
                    ("to_send", "To send"),
                    ("active", "Active"),
                    ("to_delete", "To delete"),
                    ("inactive", "Inactive"),
                ],
                default="received",
                help_text="Status indicating action to do for scheduled tasks",
                max_length=50,
                verbose_name="referral note status",
            ),
        ),
        migrations.AlterField(
            model_name="referralnote",
            name="html",
            field=models.TextField(
                blank=True,
                help_text="Html generated from document file or editor",
                null=True,
                verbose_name="html",
            ),
        ),
    ]
