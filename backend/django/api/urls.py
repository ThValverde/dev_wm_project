# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserRegistrationView,
    GrupoViewSet,
    IdosoViewSet,
    MedicamentoViewSet
)

# O router cria as URLs padrão para os ViewSets (list, create, retrieve, update, destroy)
router = DefaultRouter()
router.register(r'grupos', GrupoViewSet)
router.register(r'idosos', IdosoViewSet)
router.register(r'medicamentos', MedicamentoViewSet)

urlpatterns = [
    # Rota para o registro de usuário
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    
    # Inclui todas as rotas geradas pelo router
    path('', include(router.urls)),
    
    # OBS: Rotas para login/logout/tokens são melhor gerenciadas por bibliotecas
    # como 'dj-rest-auth' ou 'djoser'.
]