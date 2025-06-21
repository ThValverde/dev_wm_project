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
        """
        permission_classes = [permissions.IsAuthenticated]

        # Apenas membros podem ver detalhes do grupo
        if self.action == 'retrieve':
            permission_classes = [permissions.IsAuthenticated, IsGroupMember]
        
        # Apenas o admin pode editar, deletar ou ver o código de acesso
        elif self.action in ['update', 'partial_update', 'destroy', 'codigo_acesso']:
            permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]

        return [permission() for permission in permission_classes]


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_serializer = GrupoSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Define o usuário logado como administrador do grupo ao criar."""
        grupo = serializer.save(admin=self.request.user)
        perfil_usuario = PerfilUsuario.objects.get(user=self.request.user)
        perfil_usuario.grupos.add(grupo)
        perfil_usuario.permissao = PerfilUsuario.Permissao.ADMIN
        perfil_usuario.save()

    @action(detail=False, methods=['get'], url_path='meus-grupos')
    def meus_grupos(self, request):
        """Retorna os detalhes dos grupos aos quais o usuário logado pertence."""
        perfil_usuario = request.user.perfil
        grupos = perfil_usuario.grupos.all()
        if not grupos.exists():
            return Response({'detail': 'Você não pertence a nenhum grupo.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(grupos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='codigo-de-acesso')
    def codigo_acesso(self, request, pk=None):
        """Retorna o código de acesso do grupo. Apenas para o admin."""
        grupo = self.get_object()
        # A verificação de permissão agora é tratada por get_permissions e IsGroupAdmin
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
            grupo = Grupo.objects.get(codigo_acesso=codigo)
        except Grupo.DoesNotExist:
            return Response({'detail': 'Grupo com este código de acesso não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        perfil_usuario = request.user.perfil
        if grupo in perfil_usuario.grupos.all():
            return Response({'detail': f'Você já é membro do grupo {grupo.nome}.'}, status=status.HTTP_400_BAD_REQUEST)

        perfil_usuario.grupos.add(grupo)
        if not perfil_usuario.permissao: # Define como membro apenas se não tiver uma permissão
            perfil_usuario.permissao = PerfilUsuario.Permissao.MEMBRO
        perfil_usuario.save()

        return Response({'detail': f'Bem-vindo ao grupo {grupo.nome}!'}, status=status.HTTP_200_OK)

# --- Views de Recursos do Grupo (Idosos, Medicamentos) ---

class IdosoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_serializer_class(self):
        if self.action == 'list':
            return IdosoListSerializer
        return IdosoDetailSerializer

    def get_queryset(self):
        """
        Filtra o queryset para retornar apenas idosos do grupo 
        especificado na URL da rota aninhada.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Idoso.objects.filter(grupo_id=grupo_pk)
        return Idoso.objects.none()

    def perform_create(self, serializer):
        """
        Ao criar um idoso, associa-o ao grupo especificado na URL.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        serializer.save(grupo=grupo)

class MedicamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Medicamentos do grupo."""
    serializer_class = MedicamentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    
    def get_queryset(self):
        """
        Filtra para retornar apenas medicamentos do grupo especificado na URL.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Medicamento.objects.filter(grupo_id=grupo_pk)
        return Medicamento.objects.none()

    def perform_create(self, serializer):
        """
        Ao criar um medicamento, associa-o ao grupo especificado na URL.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        serializer.save(grupo=grupo)


class PrescricaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar as Prescrições de medicamentos para os idosos.
    """
    serializer_class = PrescricaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        """
        Filtra as prescrições para o grupo especificado na URL.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Prescricao.objects.filter(idoso__grupo_id=grupo_pk)
        return Prescricao.objects.none()

    def perform_create(self, serializer):
        """
        Ao criar uma prescrição, garante que o idoso e o medicamento
        pertençam ao grupo especificado na URL.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        idoso_id = self.request.data.get('idoso_id')
        medicamento_id = self.request.data.get('medicamento_id')
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        medicamento = get_object_or_404(Medicamento, pk=medicamento_id, grupo_id=grupo_pk)
        serializer.save(idoso=idoso, medicamento=medicamento)
    
    @action(detail=True, methods=['post'], url_path='administrar')
    @transaction.atomic
    def administrar(self, request, pk=None, grupo_pk=None):
        """
        Cria um LogAdministracao para esta prescrição e decrementa o estoque.
        Permite fornecer uma 'data_hora_administracao' (formato ISO) no corpo
        da requisição para registros retroativos. Se não for fornecida, usa a data/hora atual.
        """
        prescricao = self.get_object()
        medicamento = prescricao.medicamento

        if medicamento.quantidade_estoque <= 0:
            return Response(
                {'error': 'Estoque do medicamento zerado.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        medicamento.quantidade_estoque -= 1
        medicamento.save()

        # Prepara os dados base para o log de administração
        log_data = {
            "prescricao": prescricao,
            "usuario_responsavel": request.user,
            "status": request.data.get('status', LogAdministracao.StatusDose.ADMINISTRADO),
            "observacoes": request.data.get('observacoes', '')
        }

        # Verifica se o cliente enviou uma data/hora específica
        custom_datetime_str = request.data.get('data_hora_administracao')
        if custom_datetime_str:
            try:
                # Converte a string (formato ISO) para um objeto datetime
                custom_datetime = parse_datetime(custom_datetime_str)
                if not custom_datetime: # parse_datetime retorna None se o formato for inválido
                    raise ValueError
                # Adiciona a data customizada aos dados do log
                log_data['data_hora_administracao'] = custom_datetime
            except (ValueError, TypeError):
                return Response(
                    {'error': 'O formato de data_hora_administracao é inválido. Use o formato ISO (ex: YYYY-MM-DDTHH:MM:SSZ).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Cria o Log com os dados preparados. Se 'data_hora_administracao' não estiver
        # em log_data, o modelo usará o valor 'default=timezone.now'.
        log = LogAdministracao.objects.create(**log_data)

        log_serializer = LogAdministracaoSerializer(log)
        return Response(log_serializer.data, status=status.HTTP_201_CREATED)
    


class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar usuários de um grupo e gerenciar suas responsabilidades
    sobre os idosos.
    """
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        """
        Filtra para mostrar apenas os perfis de usuário do grupo
        especificado na URL da rota aninhada.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            # CORREÇÃO: Usa o related_name 'membros' definido no modelo PerfilUsuario
            grupo = get_object_or_404(Grupo, pk=grupo_pk)
            return grupo.membros.all()
        return PerfilUsuario.objects.none()

    @action(
        detail=True, 
        methods=['post'], 
        url_path='vincular-idoso',
        permission_classes=[IsGroupMember]
    )
    def vincular_idoso(self, request, pk=None, grupo_pk=None):
        """
        Vincula um idoso à lista de responsabilidades de um usuário (cuidador).
        """
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Garante que o idoso a ser vinculado pertence ao mesmo grupo da URL
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)

        perfil_usuario_alvo.responsaveis.add(idoso)
        
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)

    @action(
        detail=True, 
        methods=['post'], 
        url_path='desvincular-idoso',
        permission_classes=[IsGroupMember]
    )
    def desvincular_idoso(self, request, pk=None, grupo_pk=None):
        """ Desvincula um idoso da lista de responsabilidades de um usuário. """
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Garante que o idoso pertence ao grupo correto antes de desvincular
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)

        perfil_usuario_alvo.responsaveis.remove(idoso)

        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)