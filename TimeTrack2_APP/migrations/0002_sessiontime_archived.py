# Generated by Django 4.2.3 on 2023-08-03 15:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('TimeTrack2_APP', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sessiontime',
            name='archived',
            field=models.BooleanField(default=True),
        ),
    ]
