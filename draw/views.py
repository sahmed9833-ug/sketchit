from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from .models import Project, Drawing
from .forms import UserForm, ProjectForm, DrawingForm


def index(request):
    if request.user.is_authenticated:
        #  projects
        projects = Project.objects.filter(user=request.user)

        #  form handler
        form = ProjectForm(request.POST or None)

        if form.is_valid():
            project = form.save(commit=False)
            project.user = request.user
            project.save()
        context = {
            "form": form,
            "projects": projects
        }
        return render(request, 'draw/index.html', context)
    else:
        return render(request, 'draw/login.html')


def project_detail(request, project_id):
    if request.user.is_authenticated:
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
    else:
        return render(request, 'draw/login.html')


def drawing_detail(request, project_id, drawing_id):
    if request.user.is_authenticated:
        # check that drawing exists
        project = get_object_or_404(Project, pk=project_id)
        drawing = get_object_or_404(Drawing, pk=drawing_id)

        form = DrawingForm(request.POST or None, instance=drawing)
        if form.is_valid():
            form.save()
        context = {
            'form': form,
            'project': project,
            'drawing': drawing
        }
        return render(request, 'draw/drawing-detail.html', context)
    else:
        return render(request, 'draw/login.html')


def new_drawing(request, project_id, new):
    if request.user.is_authenticated:
        form = DrawingForm(request.POST or None)
        project = get_object_or_404(Project, pk=project_id)
        if form.is_valid():
            form.save()
        context = {
            "form": form,
            "project": project
        }
        return render(request, 'draw/drawing-detail.html', context)
    else:
        render(request, 'draw/login.html')


def delete_project(request, project_id, delete_project):
    project = Project.objects.get(pk=project_id)
    project.delete()
    context = {
        "form": ProjectForm(request.POST or None),
        "projects": Project.objects.filter(user=request.user)
    }
    return render(request, 'draw/index.html', context)


def delete_drawing(request, project_id, drawing_id, delete):
    drawing = Drawing.objects.get(pk=drawing_id)
    project = Project.objects.get(pk=project_id)
    drawings = Drawing.objects.filter(project=project)
    drawing.delete()
    context = {
        "project": project,
        "drawings": drawings
    }
    return render(request, 'draw/project-detail.html', context)


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
                form = ProjectForm(request.POST or None)
                context = {
                    'projects': projects,
                    'form': form
                }
                return redirect('draw:index')
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
