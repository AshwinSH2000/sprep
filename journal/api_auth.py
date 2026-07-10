from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token


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
        return Response({'id': user.id, 'username': user.username})


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=204)


class MeAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                'authenticated': True,
                'id': request.user.id,
                'username': request.user.username,
            })
        return Response({'authenticated': False})
