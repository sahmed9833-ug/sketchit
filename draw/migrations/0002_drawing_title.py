# Generated by Django 2.0.4 on 2018-07-05 17:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('draw', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='drawing',
            name='title',
            field=models.CharField(default='Untitled', max_length=250),
        ),
    ]
