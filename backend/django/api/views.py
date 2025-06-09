# api/views.py

from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password

# Nossos modelos, serializers e permissões customizadas
from .models import Grupo, Idoso, Medicamento, PerfilUsuario
from .serializers import (
    UserRegistrationSerializer,
    GrupoSerializer,
    GrupoCreateSerializer,
    IdosoListSerializer,
    IdosoDetailSerializer,
    MedicamentoSerializer
)
from .permissions import IsGroupMember, IsGroupAdmin


# --- Views de Autenticação e Usuário ---

class UserRegistrationView(generics.CreateAPIView):
    """
    Endpoint público para qualquer um se registrar no sistema.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Qualquer um pode se registrar.


# --- View de Gerenciamento de Grupo ---

class GrupoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Grupos. Inclui ações customizadas
    para entrar em um grupo, gerar código e ver o grupo do usuário.
    """
    queryset = Grupo.objects.all()

    def get_serializer_class(self):
        # Usa um serializer para criação e outro para as demais ações.
        if self.action == 'create':
            return GrupoCreateSerializer
        return GrupoSerializer

    def get_permissions(self):
        """Define permissões por ação."""
        if self.action in ['join', 'retrieve']:
            # Para entrar ou ver detalhes, basta estar autenticado.
            # A lógica de senha/código será feita na própria action.
            self.permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy', 'generate_access_code']:
            # Apenas o admin do grupo pode alterar, deletar ou gerar código.
            self.permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]
        else:
            # Para outras ações (como listar todos os grupos), apenas estar autenticado.
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='meu-grupo')
    def meu_grupo(self, request):
        """Retorna os detalhes do grupo ao qual o usuário logado pertence."""
        if not request.user.perfil.grupo:
            return Response({'detail': 'Você não pertence a nenhum grupo.'}, status=status.HTTP_404_NOT_FOUND)
        
        grupo = request.user.perfil.grupo
        serializer = self.get_serializer(grupo)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='entrar')
    def entrar(self, request, pk=None):
        """Ação para um usuário entrar em um grupo usando a senha."""
        grupo = self.get_object()
        perfil_usuario = request.user.perfil

        if perfil_usuario.grupo:
            return Response({'detail': 'Você já pertence a um grupo.'}, status=status.HTTP_400_BAD_REQUEST)

        senha = request.data.get('senha')
        if not senha or not check_password(senha, grupo.senha_hash):
            return Response({'detail': 'Senha do grupo incorreta.'}, status=status.HTTP_403_FORBIDDEN)
        
        perfil_usuario.grupo = grupo
        perfil_usuario.permissao = PerfilUsuario.Permissao.MEMBRO # Define como membro padrão
        perfil_usuario.save()

        return Response({'detail': f'Bem-vindo ao grupo {grupo.nome}!'}, status=status.HTTP_200_OK)


# --- Views de Recursos do Grupo (Idosos, Medicamentos) ---

class IdosoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar os Idosos.
    A lógica garante que um usuário só veja e gerencie os idosos do seu próprio grupo.
    """

    queryset = Idoso.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return IdosoListSerializer
        return IdosoDetailSerializer
    
    def get_queryset(self):
        """Filtra o queryset para retornar apenas idosos do grupo do usuário."""
        user_grupo = self.request.user.perfil.grupo
        if user_grupo:
            return Idoso.objects.filter(grupo=user_grupo)
        return Idoso.objects.none() # Retorna nada se o usuário não tem grupo

    def perform_create(self, serializer):
        """Define o grupo do idoso automaticamente ao criar."""
        serializer.save(grupo=self.request.user.perfil.grupo)


    def get_serializer_class(self):
        """Retorna o serializer apropriado baseado na ação."""
        if self.action == 'list':
            return IdosoListSerializer
        return IdosoDetailSerializer
    
    def get_queryset(self):
        """Filtra para retornar apenas idosos do grupo do usuário."""
        user_grupo = self.request.user.perfil.grupo
        if user_grupo:
            return Idoso.objects.filter(grupo=user_grupo)
        return Idoso.objects.none()


class MedicamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Medicamentos do grupo."""
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def perform_create(self, serializer):
        """Define o grupo do medicamento automaticamente ao criar."""
        serializer.save(grupo=self.request.user.perfil.grupo)

    def get_queryset(self):
        """Filtra para retornar apenas medicamentos do grupo do usuário."""
        user_grupo = self.request.user.perfil.grupo
        if user_grupo:
            return Medicamento.objects.filter(grupo=user_grupo)
        return Medicamento.objects.none()