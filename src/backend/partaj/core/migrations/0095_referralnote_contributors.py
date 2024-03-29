# Generated by Django 3.0.5 on 2023-07-25 08:16

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0094_referralreportversion_version_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="referralnote",
            name="contributors",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=255),
                blank=True,
                help_text="Full names from note contributors",
                null=True,
                size=None,
                verbose_name="contributors",
            ),
        ),
    ]
