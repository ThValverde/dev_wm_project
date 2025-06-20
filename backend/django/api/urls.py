# api/urls.py

from django.urls import path, include
# Remova o DefaultRouter do DRF e importe os roteadores da nova biblioteca
from rest_framework_nested import routers
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

# 1. Crie o roteador principal (pai) para os Grupos
router = routers.DefaultRouter()
router.register(r'grupos', GrupoViewSet, basename='grupo')

# 2. Crie um roteador aninhado a partir do roteador de Grupos
# O prefixo será 'grupos' e o 'lookup' é a variável que conterá o ID do grupo na URL
grupos_router = routers.NestedDefaultRouter(router, r'grupos', lookup='grupo')

# 3. Registre os recursos "filhos" (Idosos, Medicamentos, etc.) no roteador aninhado
# Agora as rotas serão /grupos/{grupo_pk}/idosos/
grupos_router.register(r'idosos', IdosoViewSet, basename='grupo-idosos')
# Rota: /grupos/{grupo_pk}/medicamentos/
grupos_router.register(r'medicamentos', MedicamentoViewSet, basename='grupo-medicamentos')
# Rota: /grupos/{grupo_pk}/prescricoes/
grupos_router.register(r'prescricoes', PrescricaoViewSet, basename='grupo-prescricoes')
# Rota: /grupos/{grupo_pk}/usuarios/ (para listar os membros daquele grupo)
grupos_router.register(r'usuarios', UsuarioViewSet, basename='grupo-usuarios')


# O roteador de autenticação e perfil permanece separado
urlpatterns = [
    # Rotas de Autenticação e Perfil
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/profile/', MyProfileView.as_view(), name='user-profile'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password-change'),

    path('auth/', include('dj_rest_auth.urls')),
    # Inclui as URLs do roteador principal E do roteador aninhado
    path('', include(router.urls)),
    path('', include(grupos_router.urls)),
]