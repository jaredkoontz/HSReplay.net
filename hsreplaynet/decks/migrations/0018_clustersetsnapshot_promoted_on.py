# -*- coding: utf-8 -*-
# Generated by Django 1.11.6 on 2017-11-10 02:25
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('decks', '0017_auto_20170919_0833'),
    ]

    operations = [
        migrations.AddField(
            model_name='clustersetsnapshot',
            name='promoted_on',
            field=models.DateTimeField(null=True),
        ),
    ]