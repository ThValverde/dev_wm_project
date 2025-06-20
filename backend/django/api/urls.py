# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserRegistrationView,
    GrupoViewSet,
    IdosoViewSet,
    MedicamentoViewSet,
    PrescricaoViewSet,
    UsuarioViewSet,
    UserRegistrationView,
    MyProfileView,
    ChangePasswordView,
)


router = DefaultRouter()
router.register(r'grupos', GrupoViewSet)
router.register(r'idosos', IdosoViewSet)
router.register(r'medicamentos', MedicamentoViewSet)
router.register(r'usuario', UsuarioViewSet, basename='usuario')
router.register(r'prescricoes', PrescricaoViewSet)

urlpatterns = [
    # Rota para o registro de usuário
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/profile/', MyProfileView.as_view(), name='my-profile'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password-change'),
    path('', include(router.urls)),

]