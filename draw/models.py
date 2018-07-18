from django.contrib.auth.models import Permission, User
from django.db import models
'''
when modifying the below tables run the following two commands:
> py manage.py makemigrations draw
> py manage.py migrate
'''


class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=1)
    title = models.CharField(max_length=250, default='Default')
    summary = models.CharField(default='No summary', max_length=1000, blank=True, null=True)
    shared = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Drawing(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(default='Untitled', max_length=250)
    description = models.CharField(default='No description', max_length=1000, blank=True, null=True)
    last_modified = models.DateField(auto_now=True)
    is_pinned = models.BooleanField(default=False)
    json_string = models.CharField(default='JSON goes here', max_length=1000)

    def __str__(self):
        return self.title
