# api/urls.py

from django.urls import path, include
# Importa o roteador aninhado da biblioteca rest_framework_nested
from rest_framework_nested import routers
# Importa as ViewSets da aplicação
from .views import (
    UserRegistrationView,
    MyProfileView, 
    ChangePasswordView,
    GrupoViewSet,
    IdosoViewSet,
    MedicamentoViewSet,
    PrescricaoViewSet,
    UsuarioViewSet,
)

# 1. Criação do roteador principal (pai) para a entidade 'Grupo'.
# Este roteador gerencia as URLs de nível superior para os grupos, como /grupos/ e /grupos/{pk}/.
router = routers.DefaultRouter()
router.register(r'grupos', GrupoViewSet, basename='grupo')

# 2. Criação de um roteador aninhado a partir do roteador de Grupos.
# Isso permite criar URLs que representam a relação de um grupo com outras entidades.
# O prefixo 'grupos' vem do roteador pai.
# O 'lookup' 'grupo' é a variável que conterá o ID do grupo na URL (ex: /grupos/{grupo_pk}/...).
grupos_router = routers.NestedDefaultRouter(router, r'grupos', lookup='grupo')

# 3. Registro dos recursos "filhos" (Idosos, Medicamentos, etc.) no roteador aninhado.
# As URLs para esses recursos estarão subordinadas a um grupo específico.

# Registra a ViewSet de Idosos. URL gerada: /grupos/{grupo_pk}/idosos/
grupos_router.register(r'idosos', IdosoViewSet, basename='grupo-idosos')
# Registra a ViewSet de Medicamentos. URL gerada: /grupos/{grupo_pk}/medicamentos/
grupos_router.register(r'medicamentos', MedicamentoViewSet, basename='grupo-medicamentos')
# Registra a ViewSet de Prescrições. URL gerada: /grupos/{grupo_pk}/prescricoes/
grupos_router.register(r'prescricoes', PrescricaoViewSet, basename='grupo-prescricoes')
# Registra a ViewSet de Usuários para listar membros de um grupo. URL gerada: /grupos/{grupo_pk}/usuarios/
grupos_router.register(r'usuarios', UsuarioViewSet, basename='grupo-usuarios')


# Lista principal de padrões de URL da API.
urlpatterns = [
    # Rotas de Autenticação e Perfil de Usuário (não aninhadas)
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/profile/', MyProfileView.as_view(), name='user-profile'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password-change'),

    # Inclui as URLs padrão fornecidas pela biblioteca dj-rest-auth (para login, logout, etc.)
    path('auth/', include('dj_rest_auth.urls')),
    
    # Inclui as URLs geradas pelo roteador principal (para /grupos/)
    path('', include(router.urls)),
    # Inclui as URLs geradas pelo roteador aninhado (para /grupos/{grupo_pk}/recurso/)
    path('', include(grupos_router.urls)),
]