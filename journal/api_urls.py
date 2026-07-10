from django.urls import path

from . import api_auth, api_views

app_name = 'journal_api'

urlpatterns = [
    path('entries/', api_views.EntryCreateAPIView.as_view(), name='entry-create'),
    path('entries/today/', api_views.TodaysEntriesAPIView.as_view(), name='entries-today'),
    path('entries/due/', api_views.DueEntriesAPIView.as_view(), name='entries-due'),
    path('entries/flagged/', api_views.FlaggedEntriesAPIView.as_view(), name='entries-flagged'),
    path('entries/archive/', api_views.ArchiveAPIView.as_view(), name='entries-archive'),
    path('entries/all/', api_views.AllEntriesAPIView.as_view(), name='entries-all'),
    path('entries/export/', api_views.EntryExportAPIView.as_view(), name='entries-export'),
    path('tags/', api_views.TagListAPIView.as_view(), name='tags-list'),
    path('stats/', api_views.StatsAPIView.as_view(), name='stats'),
    path('entries/bulk/', api_views.EntryBulkActionAPIView.as_view(), name='entries-bulk'),
    path('entries/<int:pk>/done/', api_views.EntryMarkDoneAPIView.as_view(), name='entry-done'),
    path('entries/<int:pk>/remind/', api_views.EntryRemindTomorrowAPIView.as_view(), name='entry-remind'),
    path('entries/<int:pk>/comments/', api_views.EntryAddCommentAPIView.as_view(), name='entry-add-comment'),

    path('auth/csrf/', api_auth.CsrfBootstrapAPIView.as_view(), name='auth-csrf'),
    path('auth/login/', api_auth.LoginAPIView.as_view(), name='auth-login'),
    path('auth/logout/', api_auth.LogoutAPIView.as_view(), name='auth-logout'),
    path('auth/me/', api_auth.MeAPIView.as_view(), name='auth-me'),
]
