from django.contrib.auth.models import User
from .models import Project, Drawing
from django import forms


class UserForm(forms.ModelForm):
    email = forms.CharField(widget=forms.TextInput(attrs={'placeholder': "Email", 'class': "form-control"}))
    username = forms.CharField(widget=forms.TextInput(attrs={'placeholder': "Username", 'class': "form-control"}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': "Password", 'class': "form-control"}))

    class Meta:
        model = User
        fields = ['email', 'username', 'password']


class ProjectForm(forms.ModelForm):
    title = forms.CharField(widget=forms.TextInput(attrs={'placeholder': "Title", 'class': "form-control"}))
    summary = forms.CharField(widget=forms.TextInput(attrs={'placeholder': "Summary", 'class': "form-control"}))
    shared = forms.BooleanField(widget=forms.CheckboxInput, required=False)

    class Meta:
        model = Project
        exclude = ('user',)


class DrawingForm(forms.ModelForm):
    title = forms.CharField(widget=forms.TextInput(attrs={'placeholder': "Title", 'class': "form-control"}))
    project = forms.ModelChoiceField(widget=forms.Select(
        attrs={'class': "form-control"}),
        queryset=Project.objects,
        initial="Default")
    description = forms.CharField(widget=forms.TextInput(attrs={'placeholder': "Description", 'class': "form-control"}))
    is_pinned = forms.BooleanField(widget=forms.CheckboxInput, required=False)
    json_string = forms.CharField(widget=forms.Textarea(attrs={'class': "form-control"}))
    scale = forms.CharField(widget=forms.TextInput(attrs={'class': "form-control"}))

    class Meta:
        model = Drawing
        exclude = ('last_modified',)
