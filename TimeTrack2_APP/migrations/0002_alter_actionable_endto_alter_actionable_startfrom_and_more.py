# Generated by Django 4.2.3 on 2023-07-19 17:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('TimeTrack2_APP', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='actionable',
            name='endTo',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='actionable',
            name='startFrom',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='todo',
            name='dateAdded',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='todo',
            name='dateLastModified',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='todo',
            name='endTo',
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name='todo',
            name='startFrom',
            field=models.IntegerField(),
        ),
    ]
