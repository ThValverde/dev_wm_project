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
    NotificacaoViewSet # 1. IMPORTE O NOVO VIEWSET
)

# O router cria as URLs padrão
router = DefaultRouter()
router.register(r'grupos', GrupoViewSet)
router.register(r'idosos', IdosoViewSet)
router.register(r'medicamentos', MedicamentoViewSet)
router.register(r'usuario', UsuarioViewSet, basename='usuario')
router.register(r'prescricoes', PrescricaoViewSet)

# 2. REGISTRE A NOVA ROTA
router.register(r'notificacoes', NotificacaoViewSet, basename='notificacao')


urlpatterns = [
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('', include(router.urls)),
]
