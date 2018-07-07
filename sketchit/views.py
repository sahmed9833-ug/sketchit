from django.shortcuts import render


def home(request):
    message = "You are on the homepage."
    template = "home.html"
    context = {
        'message': message
    }
    return render(request, template, context)
