# Generated by Django 3.0.5 on 2020-10-15 13:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0030_add_answer_validation_responses"),
    ]

    operations = [
        migrations.AddField(
            model_name="referralanswer",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, verbose_name="updated at"),
        ),
    ]