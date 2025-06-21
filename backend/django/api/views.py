# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.utils.dateparse import parse_datetime # <-- CORREÇÃO: Importação adicionada aqui
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
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class MyProfileView(generics.RetrieveUpdateAPIView):
        serializer_class = UserProfileSerializer
        permission_classes = [permissions.IsAuthenticated]

        def get_object(self):
            return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid(raise_exception=True):
            self.object.set_password(serializer.validated_data['new_password1'])
            self.object.save()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- View de Gerenciamento de Grupo ---

class GrupoViewSet(viewsets.ModelViewSet):
    queryset = Grupo.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return GrupoCreateSerializer
        return GrupoSerializer
    
    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]
        if self.action == 'retrieve':
            permission_classes = [permissions.IsAuthenticated, IsGroupMember]
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
        grupo = serializer.save(admin=self.request.user)
        perfil_usuario = PerfilUsuario.objects.get(user=self.request.user)
        perfil_usuario.grupos.add(grupo)
        perfil_usuario.permissao = PerfilUsuario.Permissao.ADMIN
        perfil_usuario.save()

    @action(detail=False, methods=['get'], url_path='meus-grupos')
    def meus_grupos(self, request):
        perfil_usuario = request.user.perfil
        grupos = perfil_usuario.grupos.all()
        if not grupos.exists():
            return Response([], status=status.HTTP_200_OK)
        serializer = self.get_serializer(grupos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='codigo-de-acesso')
    def codigo_acesso(self, request, pk=None):
        grupo = self.get_object()
        return Response({'codigo_acesso': grupo.codigo_acesso})
    
    @action(detail=False, methods=['post'], url_path='entrar-com-codigo')
    def entrar_com_codigo(self, request):
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

# --- Views de Recursos do Grupo (Idosos, Medicamentos) ---

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

    def get_queryset(self):
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Prescricao.objects.filter(idoso__grupo_id=grupo_pk)
        return Prescricao.objects.none()

    def perform_create(self, serializer):
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

        log_data = {
            "prescricao": prescricao,
            "usuario_responsavel": request.user,
            "status": request.data.get('status', LogAdministracao.StatusDose.ADMINISTRADO),
            "observacoes": request.data.get('observacoes', '')
        }

        custom_datetime_str = request.data.get('data_hora_administracao')
        if custom_datetime_str:
            try:
                custom_datetime = parse_datetime(custom_datetime_str)
                if not custom_datetime:
                    raise ValueError
                log_data['data_hora_administracao'] = custom_datetime
            except (ValueError, TypeError):
                return Response(
                    {'error': 'O formato de data_hora_administracao é inválido. Use o formato ISO (ex: YYYY-MM-DDTHH:MM:SSZ).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

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

    @action(
        detail=True, 
        methods=['post'], 
        url_path='vincular-idoso',
        permission_classes=[IsGroupMember]
    )
    def vincular_idoso(self, request, pk=None, grupo_pk=None):
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        perfil_usuario_alvo.responsaveis.remove(idoso)
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)