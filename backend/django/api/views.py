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
        """
        Define permissões dinâmicas baseadas na ação para o Grupo.
        """
        # Ações que qualquer usuário logado pode tentar fazer.
        if self.action in ['create', 'entrar_com_codigo']:
            self.permission_classes = [permissions.IsAuthenticated]
        
        # Para ver a lista de todos os grupos (mostrando dados mínimos).
        elif self.action == 'list':
            self.permission_classes = [permissions.IsAuthenticated]

        # Para ver os detalhes de UM grupo, você precisa ser membro dele.
        elif self.action == 'retrieve':
            self.permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

        # Para atualizar, deletar ou pegar o código de acesso, você PRECISA ser o admin.
        elif self.action in ['update', 'partial_update', 'destroy', 'codigo_de_acesso']:
            self.permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

        elif self.action == 'meu_grupo':
            # Ação para retornar o grupo do usuário logado, precisa ser autenticado.
            self.permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]


        # Uma permissão padrão para qualquer outra ação que possa surgir.
        else:
            self.permission_classes = [permissions.IsAuthenticated]
            
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        # Utiliza o serializer de criação para validar a entrada (nome, senha)
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        # Chama o perform_create customizado para salvar e associar o admin ao grupo.
        self.perform_create(serializer)
        response_serializer = GrupoSerializer(serializer.instance, context=self.get_serializer_context())

        headers = self.get_success_headers(serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Define o usuário logado como administrador do grupo ao criar."""
        grupo = serializer.save(admin = self.request.user)
        perfil_usuario = PerfilUsuario.objects.get(user=self.request.user)
        perfil_usuario.grupo = grupo
        perfil_usuario.permissao = PerfilUsuario.Permissao.ADMIN  # Define como admin do grupo
        perfil_usuario.save()


    @action(detail=False, methods=['get'], url_path='meu-grupo', permission_classes=[permissions.IsAuthenticated, IsGroupAdmin])
    def meu_grupo(self, request):
        """Retorna os detalhes do grupo ao qual o usuário logado pertence."""
        if not request.user.perfil.grupo:
            return Response({'detail': 'Você não pertence a nenhum grupo.'}, status=status.HTTP_404_NOT_FOUND)
        
        grupo = request.user.perfil.grupo
        serializer = self.get_serializer(grupo)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='codigo-de-acesso', permission_classes=[IsGroupAdmin])
    def codigo_acesso(self, request, pk=None):
        grupo = self.get_object()
        return Response({'codigo_acesso' :  grupo.codigo_acesso})
    
    @action(detail=False, methods=['post'], url_path='entrar-com-codigo')
    def entrar_com_codigo(self, request):
        """
        Ação para um usuário entrar em um grupo usando o código de acesso UUID.
        """
        codigo = request.data.get('codigo_acesso')
        if not codigo:
            return Response({'detail': 'Código de acesso não fornecido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Buscamos o grupo pelo código de acesso
            grupo = Grupo.objects.get(codigo_acesso=codigo)
        except Grupo.DoesNotExist:
            return Response({'detail': 'Grupo com este código de acesso não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        perfil_usuario = request.user.perfil
        if perfil_usuario.grupo:
            return Response({'detail': 'Você já pertence a um grupo.'}, status=status.HTTP_400_BAD_REQUEST)

        perfil_usuario.grupo = grupo
        perfil_usuario.permissao = PerfilUsuario.Permissao.MEMBRO
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