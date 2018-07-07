from django.db import models
'''
when modifying the below tables run the following two commands:
> py manage.py makemigrations draw
> py manage.py migrate
'''


class Project(models.Model):
    title = models.CharField(max_length=250, default='Default')
    shared = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Drawing(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    title = models.CharField(default='Untitled', max_length=250)
    description = models.CharField(max_length=1000)
    is_pinned = models.BooleanField(default=False)
    path = models.CharField(max_length=1000)

    def __str__(self):
        return self.title
