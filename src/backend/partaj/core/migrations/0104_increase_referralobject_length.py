# Generated by Django 3.0.5 on 2024-06-03 09:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0103_nullable_scanid"),
    ]

    operations = [
        migrations.AlterField(
            model_name="referral",
            name="object",
            field=models.CharField(
                blank=True,
                help_text="Brief sentence describing the object of the referral",
                max_length=120,
                null=True,
                verbose_name="object",
            ),
        ),
    ]