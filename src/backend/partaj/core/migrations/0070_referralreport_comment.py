# Generated by Django 3.0.5 on 2022-07-13 11:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0069_referral_report_attachment"),
    ]

    operations = [
        migrations.AddField(
            model_name="referralreport",
            name="comment",
            field=models.TextField(
                blank=True,
                help_text="Comment at report sending",
                null=True,
                verbose_name="report comment",
            ),
        ),
    ]
