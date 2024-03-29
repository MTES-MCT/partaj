# Generated by Django 3.0.5 on 2023-03-15 10:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0084_referral_answer_properties"),
    ]

    operations = [
        migrations.AddField(
            model_name="unit",
            name="kdb_access",
            field=models.BooleanField(
                default=True,
                help_text="Whether this unit has access to the knowledge database",
                verbose_name="Knowledge database access",
            ),
        ),
        migrations.AddField(
            model_name="unit",
            name="kdb_export",
            field=models.BooleanField(
                default=True,
                help_text="Whether unit's referral answer are exported to the knowledge database",
                verbose_name="Knowledge database export",
            ),
        ),
    ]
