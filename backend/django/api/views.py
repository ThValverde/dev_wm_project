# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import transaction
from .models import Grupo, Idoso, Medicamento, PerfilUsuario, Prescricao, LogAdministracao
from .serializers import (
    UserRegistrationSerializer,
    GrupoSerializer,
    GrupoCreateSerializer,
    IdosoListSerializer,
    IdosoDetailSerializer,
    MedicamentoSerializer,
    PrescricaoSerializer,
    LogAdministracaoSerializer,
    PerfilUsuarioSerializer, 
    UserProfileSerializer,
    ChangePasswordSerializer
)
from .permissions import IsGroupAdmin, IsGroupMember


class UserRegistrationView(generics.CreateAPIView):
    """
    Endpoint público para qualquer um se registrar no sistema.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Qualquer um pode se registrar.


class MyProfileView(generics.RetrieveUpdateAPIView):
        """
        Endpoint para que o usuário autenticado possa ver e editar seus próprios dados.
        """
        serializer_class = UserProfileSerializer
        permission_classes = [permissions.IsAuthenticated] # Apenas usuários logados podem acessar

        def get_object(self):
            """
            Sobrescreve o método padrão para que sempre retorne o usuário
            que está fazendo a requisição (request.user).
            """
            return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    """
    Endpoint para alteração de senha do usuário autenticado.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """
        Sobrescreve para sempre retornar o usuário da requisição.
        """
        return self.request.user

    def update(self, request, *args, **kwargs):
        """
        Lógica para processar a alteração da senha.
        """
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            # Define a nova senha usando o método que já faz o hash
            self.object.set_password(serializer.validated_data['new_password1'])
            self.object.save()
            # Retorna uma resposta de sucesso sem conteúdo
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- View de Gerenciamento de Grupo ---

class GrupoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Grupos. Inclui ações customizadas
    para entrar em um grupo, gerar código e ver o grupo do usuário.
    """
    queryset = Grupo.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return GrupoCreateSerializer
        return GrupoSerializer
    
    def get_permissions(self):
        """
        Define permissões dinâmicas baseadas na ação para o Grupo.
        Esta é a ÚNICA fonte de verdade para as permissões desta ViewSet.
        """
        # Definimos uma lista padrão de permissões
        permission_classes = [permissions.IsAuthenticated]

        # Regras para ver detalhes ou a lista
        if self.action == 'retrieve' or self.action == 'meu_grupo':
            permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]
        
        # Regras para ações de admin
        elif self.action in ['update', 'partial_update', 'destroy', 'codigo_de_acesso']:
            permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

        # O return instancia e retorna a lista de permissões que definimos acima.
        return [permission() for permission in permission_classes]


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


    @action(detail=False, methods=['get'], url_path='meu-grupo')
    def meu_grupo(self, request):
        """Retorna os detalhes do grupo ao qual o usuário logado pertence."""
        if not request.user.perfil.grupo:
            return Response({'detail': 'Você não pertence a nenhum grupo.'}, status=status.HTTP_404_NOT_FOUND)
        
        grupo = request.user.perfil.grupo
        serializer = self.get_serializer(grupo)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='codigo-de-acesso')
    def codigo_acesso(self, request, pk=None):
        print(f"--- AÇÃO 'codigo_de_acesso' FOI CHAMADA PELO USUÁRIO: {request.user} ---")
        grupo = self.get_object()

        # VERIFICAÇÃO MANUAL E EXPLÍCITA
        if request.user != grupo.admin:
            print(f"--- ACESSO NEGADO: ...")
            self.permission_denied(
                request, message='Apenas o administrador do grupo pode ver o código de acesso.'
            )
        
        print(f"--- ACESSO PERMITIDO: ...")
        return Response({'codigo_acesso': grupo.codigo_acesso})
    
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
    """
    queryset = Idoso.objects.all()
    # Definimos um único serializer para todas as ações
    serializer_class = IdosoDetailSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return IdosoListSerializer
        return IdosoDetailSerializer
    
    def get_permissions(self):
        """
        Define permissões dinâmicas:
        - Membros podem ler.
        - Apenas Admins podem escrever/deletar.
        """
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [permissions.IsAuthenticated, IsGroupMember]
        else:
            self.permission_classes = [permissions.IsAuthenticated, IsGroupMember]    # Para tirar a permissão do User para adicionar ou remover usuarios
                                                                                        # alterar IsGroupMember por IsGroupAdmin
        return [permission() for permission in self.permission_classes]
    
    def get_queryset(self):
        """Filtra o queryset para retornar apenas idosos do grupo do usuário."""
        user_grupo = self.request.user.perfil.grupo
        if user_grupo:
            return Idoso.objects.filter(grupo=user_grupo)
        return Idoso.objects.none() # Retorna nada se o usuário não tem grupo

    def perform_create(self, serializer):
        """Define o grupo do idoso automaticamente ao criar."""
        serializer.save(grupo=self.request.user.perfil.grupo)

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
    


class PrescricaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar as Prescrições de medicamentos para os idosos.
    Inclui uma ação para 'administrar' uma dose, que cria um log e baixa o estoque.
    """
    queryset = Prescricao.objects.all()
    serializer_class = PrescricaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember] # Use a lógica que preferir

    def get_queryset(self):
        """Filtra as prescrições para o grupo do usuário."""
        return self.queryset.filter(idoso__grupo=self.request.user.perfil.grupo)

    def perform_create(self, serializer):
        """Ao criar uma prescrição, associa ao idoso correto do grupo."""
        idoso_id = self.request.data.get('idoso_id')
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo=self.request.user.perfil.grupo)
        serializer.save(idoso=idoso)

    @action(detail=True, methods=['post'], url_path='administrar')
    @transaction.atomic # Garante que as operações com o banco de dados aconteçam juntas ou não aconteçam
    def administrar(self, request, pk=None):
        """
        Cria um LogAdministracao para esta prescrição e decrementa o estoque do medicamento.
        """
        prescricao = self.get_object()
        medicamento = prescricao.medicamento

        if medicamento.quantidade_estoque <= 0:
            return Response(
                {'error': 'Estoque do medicamento zerado.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrementa o estoque e cria o log de administração
        medicamento.quantidade_estoque -= 1
        medicamento.save()

        log = LogAdministracao.objects.create(
            prescricao=prescricao,
            usuario_responsavel=request.user,
            status=request.data.get('status', LogAdministracao.StatusDose.ADMINISTRADO),
            observacoes=request.data.get('observacoes', '')
        )

        log_serializer = LogAdministracaoSerializer(log)
        return Response(log_serializer.data, status=status.HTTP_201_CREATED)
    

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar usuários de um grupo e gerenciar suas responsabilidades
    sobre os idosos. A criação de usuários é feita pelo endpoint de registro.
    """
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        """ Filtra para mostrar apenas os perfis de usuário do mesmo grupo. """
        if self.request.user.perfil.grupo:
            # Usamos PerfilUsuario como base para já ter acesso aos idosos responsáveis.
            return PerfilUsuario.objects.filter(grupo=self.request.user.perfil.grupo)
        return PerfilUsuario.objects.none()

    @action(
        detail=True, 
        methods=['post'], 
        url_path='vincular-idoso',
        permission_classes=[IsGroupAdmin] # Apenas admins podem vincular
    )
    def vincular_idoso(self, request, pk=None):
        """
        Vincula um idoso à lista de responsabilidades de um usuário (enfermeiro).
        Espera um 'idoso_id' no corpo da requisição.
        """
        perfil_usuario_alvo = self.get_object() # O perfil do enfermeiro a ser modificado
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Garante que o idoso a ser vinculado pertence ao mesmo grupo
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo=request.user.perfil.grupo)

        # Adiciona o idoso à lista de responsabilidades
        perfil_usuario_alvo.responsaveis.add(idoso)
        
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)

    @action(
        detail=True, 
        methods=['post'], 
        url_path='desvincular-idoso',
        permission_classes=[IsGroupAdmin] # Apenas admins podem desvincular
    )
    def desvincular_idoso(self, request, pk=None):
        """ Desvincula um idoso da lista de responsabilidades de um usuário. """
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            
        idoso = get_object_or_404(Idoso, pk=idoso_id)

        # Remove o idoso da lista de responsabilidades
        perfil_usuario_alvo.responsaveis.remove(idoso)

        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)
