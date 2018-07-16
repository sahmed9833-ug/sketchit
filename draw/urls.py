from django.urls import path
from . import views

app_name = 'draw'

urlpatterns = [
    path('', views.index, name='index'),
    path('register', views.register, name='register'),
    path('login_user', views.login, name='login_user'),
    path('logout_user', views.logout, name='logout_user'),
    path('<int:project_id>', views.project_detail, name='project_detail'),
    path('<int:project_id>/<int:drawing_id>', views.drawing_detail, name='drawing_detail')
]
