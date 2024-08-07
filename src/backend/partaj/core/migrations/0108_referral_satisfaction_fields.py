# Generated by Django 3.0.5 on 2024-07-15 12:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0107_referral_satisfaction_survey"),
    ]

    operations = [
        migrations.AlterField(
            model_name="referralsatisfaction",
            name="choice",
            field=models.IntegerField(
                choices=[
                    ("10", "satisfaction happy choice"),
                    ("5", "satisfaction normal choice"),
                    ("0", "satisfaction unhappy choice"),
                ],
                help_text="Choice made for the satisfaction request",
                verbose_name="choice",
            ),
        ),
        migrations.AlterField(
            model_name="referralsatisfaction",
            name="type",
            field=models.TextField(
                choices=[
                    ("request", "request satisfaction"),
                    ("answer", "answer satisfaction"),
                ],
                help_text="type of satisfaction request response",
                verbose_name="type",
            ),
        ),
    ]
