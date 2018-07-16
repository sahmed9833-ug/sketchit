from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.generic import View
from .models import Project, Drawing
from .forms import UserForm


def index(request):
    projects = Project.objects.all()
    context = {
        'projects': projects
    }
    return render(request, 'draw/index.html', context)


def project_detail(request, project_id):
    # check that project exists
    project = get_object_or_404(Project, pk=project_id)

    # check that this project has drawings
    try:
        drawings = Drawing.objects.filter(project=project_id)
    except Drawing.DoesNotExist:
        drawings = ''

    context = {
        'project': project,
        'drawings': drawings
    }
    return render(request, 'draw/project-detail.html', context)


def drawing_detail(request, project_id, drawing_id):
    # check that drawing exists
    project = get_object_or_404(Project, pk=project_id)
    drawing = get_object_or_404(Drawing, pk=drawing_id)

    context = {
        'project': project,
        'drawing': drawing
    }
    return render(request, 'draw/drawing-detail.html', context)


def logout(request):
    django_logout(request)
    form = UserForm(request.POST or None)
    context = {
        "form": form,
    }
    return render(request, 'draw/login.html', context)


def login(request):
    if request.method == "POST":
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        user = authenticate(username=username, password=password)
        print(user)
        if user is not None:
            if user.is_active:
                django_login(request, user)
                projects = Project.objects.filter(user=request.user)
                return render(request, 'draw/index.html', {'projects': projects})
            else:
                return render(request, 'draw/login.html', {'error_message': 'Your account has been disabled'})
        else:
            return render(request, 'draw/login.html', {'error_message': 'Username or Password is incorrect'})
    return render(request, 'draw/login.html')


def register(request):
    form = UserForm(request.POST or None)
    if form.is_valid():
        user = form.save(commit=False)
        username = form.cleaned_data['username']
        password = form.cleaned_data['password']
        user.set_password(password)
        user.save()
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                projects = Project.objects.filter(user=request.user)
                return render(request, 'draw/index.html', {'projects': projects})
    context = {
        "form": form,
    }
    return render(request, 'draw/register.html', context)