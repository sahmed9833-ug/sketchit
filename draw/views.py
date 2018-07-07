from django.shortcuts import render, get_object_or_404
from .models import Project, Drawing


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
'''






def pin_drawing(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

    try:
        drawings = Drawing.objects.filter(project=project_id)
        selected_drawing = drawings.get(pk=request.POST['drawing'])
    except (KeyError, Drawing.DoesNotExist):
        context = {
            'project': project,
            'error_message': "You did not select a valid drawing"
        }
        return render(request, 'draw/project-detail.html', context)
    else:
        selected_drawing.is_pinned = True
        selected_drawing.save()
        # return render(request, 'draw/project-detail.html', {'project': project})
        return redirect('draw:project_detail', project_id=project_id)




'''
