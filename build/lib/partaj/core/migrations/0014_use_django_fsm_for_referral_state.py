# Generated by Django 3.0.5 on 2020-04-28 14:04

from django.db import migrations

import django_fsm


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0013_add_assignments_on_referral"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="referral",
            name="status",
        ),
        migrations.AddField(
            model_name="referral",
            name="state",
            field=django_fsm.FSMField(
                choices=[
                    ("assigned", "Assigned"),
                    ("received", "Received"),
                    ("closed", "Closed"),
                    ("incomplete", "Incomplete"),
                    ("answered", "Answered"),
                ],
                default="received",
                help_text="Current treatment status for this referral",
                max_length=50,
                protected=True,
                verbose_name="referral state",
            ),
        ),
    ]