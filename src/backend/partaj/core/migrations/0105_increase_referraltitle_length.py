# Generated by Django 3.0.5 on 2024-06-03 13:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0104_increase_referralobject_length"),
    ]

    operations = [
        migrations.AlterField(
            model_name="referral",
            name="title",
            field=models.CharField(
                blank=True,
                help_text="Brief sentence describing the title of the referral",
                max_length=120,
                null=True,
                verbose_name="title",
            ),
        ),
    ]