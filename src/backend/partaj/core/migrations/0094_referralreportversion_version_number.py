# Generated by Django 3.0.5 on 2023-06-28 01:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0093_report_event_new_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="referralreportversion",
            name="version_number",
            field=models.IntegerField(
                blank=True,
                help_text="Version number",
                null=True,
                verbose_name="version_number",
            ),
        ),
    ]
