# Generated by Django 3.0.5 on 2025-05-14 09:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0115_referralgroup_cascade"),
    ]

    operations = [
        migrations.AddField(
            model_name="referral",
            name="sub_question",
            field=models.TextField(
                blank=True,
                help_text="Sub question written by the expert",
                null=True,
                verbose_name="sub_question",
            ),
        ),
        migrations.AddField(
            model_name="referral",
            name="sub_title",
            field=models.CharField(
                blank=True,
                help_text="Brief sentence describing the sub title of the referral",
                max_length=120,
                null=True,
                verbose_name="sub_title",
            ),
        ),
    ]
