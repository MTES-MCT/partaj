# Generated by Django 3.0.5 on 2023-05-16 09:41

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0090_rename_reportmessage_to_reportevent"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="reportevent",
            options={"verbose_name": "report activity"},
        ),
        migrations.AddField(
            model_name="reportevent",
            name="version",
            field=models.ForeignKey(
                blank=True,
                help_text="Report version to which this event is related",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="events",
                to="core.ReferralReportVersion",
                verbose_name="version",
            ),
        ),
        migrations.AlterField(
            model_name="reportevent",
            name="report",
            field=models.ForeignKey(
                help_text="Report to which this event is related",
                on_delete=django.db.models.deletion.CASCADE,
                related_name="messages",
                to="core.ReferralReport",
                verbose_name="report",
            ),
        ),
    ]
