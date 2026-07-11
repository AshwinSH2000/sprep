from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import authenticate, login, logout, password_validation
from django.core.exceptions import ValidationError
from django.middleware.csrf import get_token


def _serialize_user(user):
    return {
        'authenticated': True,
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
    }


class CsrfBootstrapAPIView(APIView):
    """
    GET this once on app boot to force-set the csrftoken cookie before any
    mutating request is attempted.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        get_token(request)
        return Response({'detail': 'CSRF cookie set'})


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=400)
        login(request, user)
        return Response(_serialize_user(user))


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=204)


class MeAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response(_serialize_user(request.user))
        return Response({'authenticated': False})


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.email = request.data.get('email', user.email)
        user.save(update_fields=['first_name', 'last_name', 'email'])
        return Response(_serialize_user(user))


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not user.check_password(old_password):
            return Response({'detail': 'Old password is incorrect'}, status=400)

        try:
            password_validation.validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response({'detail': ' '.join(exc.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        # Password change invalidates the current session — the frontend
        # sends the user back to /login to authenticate with the new password.
        logout(request)
        return Response({'detail': 'Password changed successfully'})
