# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework import mixins
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.contrib.auth import get_user_model
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

Usuario = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    View para registrar um novo usuário no sistema.
    Acessível por qualquer pessoa (AllowAny).
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class MyProfileView(generics.RetrieveUpdateAPIView):
    """
    View para que o usuário autenticado possa ver e atualizar seu próprio perfil.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Retorna o objeto do usuário logado."""
        return self.request.user

class ChangePasswordView(generics.GenericAPIView):
    """
    View para que o usuário autenticado possa alterar sua própria senha.
    Agora aceita requisições POST.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Retorna o objeto do usuário logado."""
        return self.request.user

    def post(self, request, *args, **kwargs):
        """Processa a alteração da senha via POST."""
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            # Define a nova senha e salva o usuário
            self.object.set_password(serializer.validated_data['new_password1'])
            self.object.save()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- View de Gerenciamento de Grupo ---

class GrupoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Grupos (CRUD).
    """
    queryset = Grupo.objects.all()

    def get_serializer_class(self):
        """
        Retorna o serializer apropriado dependendo da ação.
        Usa GrupoCreateSerializer para criação para não expor campos sensíveis.
        """
        if self.action == 'create':
            return GrupoCreateSerializer
        return GrupoSerializer
    
    def get_permissions(self):
        """
        Define as permissões dinamicamente com base na ação.
        - Apenas autenticados podem listar e criar.
        - Apenas membros do grupo podem ver detalhes.
        - Apenas o admin do grupo pode atualizar, deletar ou ver o código de acesso.
        """
        permission_classes = [permissions.IsAuthenticated]
        if self.action == 'retrieve':
            permission_classes = [permissions.IsAuthenticated, IsGroupMember]
        elif self.action in ['update', 'partial_update', 'destroy', 'codigo_acesso', 'remover_membro']:
            permission_classes = [permissions.IsAuthenticated, IsGroupAdmin]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Sobrescreve o método create para retornar os dados completos do grupo
        usando o GrupoSerializer após a criação bem-sucedida.
        """
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Usa o serializer padrão para a resposta, para incluir todos os campos
        response_serializer = GrupoSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """
        Ações realizadas após a validação do serializer na criação de um grupo.
        - Define o usuário criador como o administrador do grupo.
        - Adiciona o grupo ao perfil do usuário.
        - Define a permissão do usuário como ADMIN.
        """
        grupo = serializer.save(admin=self.request.user)
        perfil_usuario = PerfilUsuario.objects.get(user=self.request.user)
        perfil_usuario.grupos.add(grupo)
        perfil_usuario.permissao = PerfilUsuario.Permissao.ADMIN
        perfil_usuario.save()

    @action(detail=False, methods=['get'], url_path='meus-grupos')
    def meus_grupos(self, request):
        """
        Ação customizada para listar todos os grupos dos quais o usuário logado é membro.
        URL: /api/grupos/meus-grupos/
        """
        perfil_usuario = request.user.perfil
        grupos = perfil_usuario.grupos.all()
        if not grupos.exists():
            return Response([], status=status.HTTP_200_OK)
        serializer = self.get_serializer(grupos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='codigo-de-acesso')
    def codigo_acesso(self, request, pk=None):
        """
        Ação para obter o código de acesso de um grupo específico.
        Apenas o admin do grupo pode acessar.
        URL: /api/grupos/{pk}/codigo-de-acesso/
        """
        grupo = self.get_object()
        return Response({'codigo_acesso': grupo.codigo_acesso})
    
    @action(detail=False, methods=['post'], url_path='entrar-com-codigo')
    def entrar_com_codigo(self, request):
        """
        Ação para um usuário entrar em um grupo usando um código de acesso.
        URL: /api/grupos/entrar-com-codigo/
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
        if not perfil_usuario.permissao:
            perfil_usuario.permissao = PerfilUsuario.Permissao.MEMBRO
        perfil_usuario.save()

        return Response({'detail': f'Bem-vindo ao grupo {grupo.nome}!'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='remover-membro')
    def remover_membro(self, request, pk=None):
        """
        Remove um membro do grupo. Apenas o admin pode fazer isso.
        """
        grupo = self.get_object()
        user_id_to_remove = request.data.get('user_id')

        if not user_id_to_remove:
            return Response({'detail': 'O ID do usuário é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_to_remove = Usuario.objects.get(id=user_id_to_remove)
            perfil_alvo = PerfilUsuario.objects.get(user=user_to_remove)
        except (Usuario.DoesNotExist, PerfilUsuario.DoesNotExist):
            return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        if user_to_remove == request.user:
            return Response({'detail': 'O administrador não pode remover a si mesmo do grupo.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if grupo not in perfil_alvo.grupos.all():
            return Response({'detail': 'Este usuário não é membro do grupo.'}, status=status.HTTP_400_BAD_REQUEST)

        perfil_alvo.grupos.remove(grupo)
        
        if perfil_alvo.grupos.count() == 0:
            perfil_alvo.permissao = PerfilUsuario.Permissao.MEMBRO
            perfil_alvo.save()

        return Response({'detail': f'Usuário {user_to_remove.nome_completo} removido do grupo.'}, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Sobrescreve o método destroy para garantir que o admin possa deletar o grupo.
        """
        grupo = self.get_object()
        self.perform_destroy(grupo)
        return Response(status=status.HTTP_204_NO_CONTENT)

# --- Views de Recursos do Grupo (Idosos, Medicamentos, etc.) ---

class IdosoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    def get_serializer_class(self):
        if self.action == 'list':
            return IdosoListSerializer
        return IdosoDetailSerializer
    def get_queryset(self):
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Idoso.objects.filter(grupo_id=grupo_pk)
        return Idoso.objects.none()
    def perform_create(self, serializer):
        grupo_pk = self.kwargs.get('grupo_pk')
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        serializer.save(grupo=grupo)

class MedicamentoViewSet(viewsets.ModelViewSet):
    serializer_class = MedicamentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    pagination_class = None
    def get_queryset(self):
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Medicamento.objects.filter(grupo_id=grupo_pk)
        return Medicamento.objects.none()
    def perform_create(self, serializer):
        grupo_pk = self.kwargs.get('grupo_pk')
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        serializer.save(grupo=grupo)

class PrescricaoViewSet(viewsets.ModelViewSet):
    serializer_class = PrescricaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    pagination_class = None
    def get_queryset(self):
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Prescricao.objects.filter(idoso__grupo_id=grupo_pk)
        return Prescricao.objects.none()
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'], url_path='administrar')
    @transaction.atomic
    def administrar(self, request, pk=None, grupo_pk=None):
        prescricao = self.get_object()
        medicamento = prescricao.medicamento
        dose = prescricao.dose_valor
        if medicamento.quantidade_estoque < dose:
            return Response({'error': 'Estoque insuficiente para administrar a dose.'}, status=status.HTTP_400_BAD_REQUEST)
        medicamento.quantidade_estoque -= dose
        medicamento.save()
        log_data = {"prescricao": prescricao, "usuario_responsavel": request.user, "status": request.data.get('status', LogAdministracao.StatusDose.ADMINISTRADO), "observacoes": request.data.get('observacoes', '')}
        custom_datetime_str = request.data.get('data_hora_administracao')
        if custom_datetime_str:
            try:
                custom_datetime = parse_datetime(custom_datetime_str)
                if not custom_datetime: raise ValueError
                log_data['data_hora_administracao'] = custom_datetime
            except (ValueError, TypeError):
                return Response({'error': 'O formato de data_hora_administracao é inválido. Use o formato ISO (ex: YYYY-MM-DDTHH:MM:SSZ).'}, status=status.HTTP_400_BAD_REQUEST)
        log = LogAdministracao.objects.create(**log_data)
        log_serializer = LogAdministracaoSerializer(log)
        return Response(log_serializer.data, status=status.HTTP_201_CREATED)

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    def get_queryset(self):
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            grupo = get_object_or_404(Grupo, pk=grupo_pk)
            return grupo.membros.all()
        return PerfilUsuario.objects.none()
    @action(detail=True, methods=['post'], url_path='vincular-idoso', permission_classes=[IsGroupMember])
    def vincular_idoso(self, request, pk=None, grupo_pk=None):
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')
        if not idoso_id: return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        perfil_usuario_alvo.responsaveis.add(idoso)
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)
    @action(detail=True, methods=['post'], url_path='desvincular-idoso', permission_classes=[IsGroupMember])
    def desvincular_idoso(self, request, pk=None, grupo_pk=None):
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')
        if not idoso_id: return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        perfil_usuario_alvo.responsaveis.remove(idoso)
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)

class LogAdministracaoViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = LogAdministracaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    def get_queryset(self):
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return LogAdministracao.objects.filter(prescricao__idoso__grupo_id=grupo_pk).order_by('-data_hora_administracao')
        return LogAdministracao.objects.none()
    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsGroupAdmin()]
        return super().get_permissions()
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        log = self.get_object()
        medicamento = log.prescricao.medicamento
        dose_devolvida = log.prescricao.dose_valor
        medicamento.quantidade_estoque += dose_devolvida
        medicamento.save()
        return super().destroy(request, *args, **kwargs)
