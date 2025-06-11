# api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from django.db import transaction

# Nossos modelos, serializers e permissões customizadas
# Os imports que você já corrigiu estão corretos.
from .models import Grupo, Idoso, Medicamento, PerfilUsuario, Prescricao, LogAdministracao, Notificacao
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
    NotificacaoSerializer # Import correto
)
from .permissions import IsGroupAdmin, IsGroupMember
# from .services import enviar_notificacao_push # Removido pois não estamos usando aqui diretamente

# --- Views de Autenticação e Usuário ---

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

# --- View de Gerenciamento de Grupo ---

class GrupoViewSet(viewsets.ModelViewSet):
    queryset = Grupo.objects.all()
    # (O restante do seu código do GrupoViewSet permanece aqui, sem alterações)
    # ...

# --- Views de Recursos do Grupo (Idosos, Medicamentos) ---

class IdosoViewSet(viewsets.ModelViewSet):
    queryset = Idoso.objects.all()
    # (O restante do seu código do IdosoViewSet permanece aqui, sem alterações)
    # ...
    
class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    # (O restante do seu código do MedicamentoViewSet permanece aqui, sem alterações)
    # ...

# --- View de Prescrição (Baseado no seu arquivo original) ---

class PrescricaoViewSet(viewsets.ModelViewSet):
    queryset = Prescricao.objects.all()
    serializer_class = PrescricaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        return self.queryset.filter(idoso__grupo=self.request.user.perfil.grupo)

    def perform_create(self, serializer):
        idoso_id = self.request.data.get('idoso_id')
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo=self.request.user.perfil.grupo)
        serializer.save(idoso=idoso)

    @action(detail=True, methods=['post'], url_path='administrar')
    @transaction.atomic
    def administrar(self, request, pk=None):
        prescricao = self.get_object()
        medicamento = prescricao.medicamento
        if medicamento.quantidade_estoque <= 0:
            return Response(
                {'error': 'Estoque do medicamento zerado.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
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

# --- View de Usuário (Baseado no seu arquivo original) ---

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        if self.request.user.perfil.grupo:
            return PerfilUsuario.objects.filter(grupo=self.request.user.perfil.grupo)
        return PerfilUsuario.objects.none()

    # >>> ADICIONE ESTA NOVA AÇÃO <<<
    @action(detail=True, methods=['post'], url_path='registrar-token')
    def registrar_token(self, request, pk=None):
        perfil_usuario = self.get_object()
        token = request.data.get('device_token')

        if not token:
            return Response({'error': 'O device_token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if perfil_usuario.user != request.user:
            return Response({'error': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)

        perfil_usuario.device_token = token
        perfil_usuario.save()
        return Response(self.get_serializer(perfil_usuario).data)

    # (Suas ações 'vincular-idoso' e 'desvincular-idoso' continuam aqui)
    # ...

# >>> ADICIONE ESTE NOVO VIEWSET NO FINAL DO ARQUIVO <<<
class NotificacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Fornece a lista de notificações (histórico) para o usuário logado.
    """
    serializer_class = NotificacaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ Retorna apenas as notificações do usuário logado. """
        return self.request.user.notificacoes.all().order_by('-data_criacao')

    @action(detail=True, methods=['post'], url_path='marcar-como-lida')
    def marcar_como_lida(self, request, pk=None):
        """ Marca uma notificação específica como lida. """
        notificacao = self.get_object()
        notificacao.lida = True
        notificacao.save()
        return Response(self.get_serializer(notificacao).data)