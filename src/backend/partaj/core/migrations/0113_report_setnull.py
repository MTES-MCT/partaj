# Generated by Django 3.0.5 on 2025-03-25 14:18

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0112_referralgroup_referralsection"),
    ]

    operations = [
        migrations.AlterField(
            model_name="referral",
            name="report",
            field=models.OneToOneField(
                blank=True,
                help_text="The referral unit report",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="core.ReferralReport",
                verbose_name="report",
            ),
        ),
    ]
