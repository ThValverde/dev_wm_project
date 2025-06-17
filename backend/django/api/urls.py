# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserRegistrationView,
    GrupoViewSet,
    IdosoViewSet,
    MedicamentoViewSet,
    PrescricaoViewSet,
    UsuarioViewSet
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
    path('', include(router.urls)),

]