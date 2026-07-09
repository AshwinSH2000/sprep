from django.urls import path
from . import views

app_name = 'journal'

urlpatterns = [
    # Main page — entry input + review sections
    path('', views.home, name='home'),

    path('entry/<int:pk>/done/', views.mark_done, name='mark_done'),
    path('entry/<int:pk>/remind/', views.remind_tomorrow, name='remind_tomorrow'),
    path('entry/<int:pk>/comment/', views.add_comment, name='add_comment'),
    path('archive/', views.archive, name='archive'),

    # Stub route for Phase 7 — not wired yet, just named for future use
    # path('entry/<int:pk>/edit/', views.edit_entry, name='edit_entry'),
]