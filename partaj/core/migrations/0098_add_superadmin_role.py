# Generated by Django 3.0.5 on 2023-12-12 12:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0097_reportmessagenotification_types"),
    ]

    operations = [
        migrations.AlterField(
            model_name="eventmetadata",
            name="receiver_role",
            field=models.CharField(
                blank=True,
                choices=[
                    ("superadmin", "Super Admin"),
                    ("admin", "Admin"),
                    ("member", "Member"),
                    ("owner", "Owner"),
                ],
                help_text="unit role the event is targeted to",
                max_length=200,
                null=True,
                verbose_name="receiver unit role",
            ),
        ),
        migrations.AlterField(
            model_name="eventmetadata",
            name="sender_role",
            field=models.CharField(
                blank=True,
                choices=[
                    ("superadmin", "Super Admin"),
                    ("admin", "Admin"),
                    ("member", "Member"),
                    ("owner", "Owner"),
                ],
                help_text="unit role the event is from",
                max_length=200,
                null=True,
                verbose_name="sender unit role",
            ),
        ),
        migrations.AlterField(
            model_name="unitmembership",
            name="role",
            field=models.CharField(
                choices=[
                    ("superadmin", "Super Admin"),
                    ("admin", "Admin"),
                    ("member", "Member"),
                    ("owner", "Owner"),
                ],
                default="member",
                help_text="Role granted to the user in the unit by this membership",
                max_length=20,
                verbose_name="role",
            ),
        ),
    ]