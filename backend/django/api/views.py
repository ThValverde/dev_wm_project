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

class ChangePasswordView(generics.UpdateAPIView):
    """
    View para que o usuário autenticado possa alterar sua própria senha.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Retorna o objeto do usuário logado."""
        return self.request.user

    def update(self, request, *args, **kwargs):
        """Processa a alteração da senha."""
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
        elif self.action in ['update', 'partial_update', 'destroy', 'codigo_acesso']:
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
        # Verifica se o usuário já é membro do grupo
        if grupo in perfil_usuario.grupos.all():
            return Response({'detail': f'Você já é membro do grupo {grupo.nome}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Adiciona o usuário ao grupo e define sua permissão como MEMBRO se ainda não tiver uma.
        perfil_usuario.grupos.add(grupo)
        if not perfil_usuario.permissao:
            perfil_usuario.permissao = PerfilUsuario.Permissao.MEMBRO
        perfil_usuario.save()

        return Response({'detail': f'Bem-vindo ao grupo {grupo.nome}!'}, status=status.HTTP_200_OK)

# --- Views de Recursos do Grupo (Idosos, Medicamentos) ---

class IdosoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Idosos dentro de um grupo específico.
    Acessado via URL aninhada: /api/grupos/{grupo_pk}/idosos/
    """
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_serializer_class(self):
        """Usa um serializer simplificado para a lista e um detalhado para as outras ações."""
        if self.action == 'list':
            return IdosoListSerializer
        return IdosoDetailSerializer

    def get_queryset(self):
        """Filtra os idosos para retornar apenas aqueles do grupo especificado na URL."""
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Idoso.objects.filter(grupo_id=grupo_pk)
        return Idoso.objects.none() # Retorna queryset vazio se não houver grupo_pk

    def perform_create(self, serializer):
        """Associa o novo idoso ao grupo correto ao ser criado."""
        grupo_pk = self.kwargs.get('grupo_pk')
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        serializer.save(grupo=grupo)

class MedicamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Medicamentos dentro de um grupo específico.
    Acessado via URL aninhada: /api/grupos/{grupo_pk}/medicamentos/
    """
    serializer_class = MedicamentoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    
    def get_queryset(self):
        """Filtra os medicamentos para retornar apenas aqueles do grupo especificado na URL."""
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Medicamento.objects.filter(grupo_id=grupo_pk)
        return Medicamento.objects.none()

    def perform_create(self, serializer):
        """Associa o novo medicamento ao grupo correto ao ser criado."""
        grupo_pk = self.kwargs.get('grupo_pk')
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        serializer.save(grupo=grupo)


class PrescricaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Prescrições de medicamentos para idosos dentro de um grupo.
    Acessado via URL aninhada: /api/grupos/{grupo_pk}/prescricoes/
    """
    serializer_class = PrescricaoSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        """Filtra as prescrições para retornar apenas aquelas de idosos do grupo especificado."""
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            return Prescricao.objects.filter(idoso__grupo_id=grupo_pk)
        return Prescricao.objects.none()

    def perform_create(self, serializer):
        """
        Associa a nova prescrição a um idoso e a um medicamento,
        garantindo que ambos pertençam ao grupo correto.
        """
        grupo_pk = self.kwargs.get('grupo_pk')
        idoso_id = self.request.data.get('idoso_id')
        medicamento_id = self.request.data.get('medicamento_id')
        # Garante que o idoso e o medicamento pertencem ao grupo da URL
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        medicamento = get_object_or_404(Medicamento, pk=medicamento_id, grupo_id=grupo_pk)
        serializer.save(idoso=idoso, medicamento=medicamento)
    
    @action(detail=True, methods=['post'], url_path='administrar')
    @transaction.atomic # Garante que as operações no banco de dados sejam atômicas
    def administrar(self, request, pk=None, grupo_pk=None):
        """
        Ação para registrar a administração de um medicamento de uma prescrição.
        Cria um LogAdministracao e decrementa o estoque do medicamento.
        Permite fornecer uma 'data_hora_administracao' (formato ISO) no corpo
        da requisição para registros retroativos. Se não for fornecida, usa a data/hora atual.
        URL: /api/grupos/{grupo_pk}/prescricoes/{pk}/administrar/
        """
        prescricao = self.get_object()
        medicamento = prescricao.medicamento

        # Verifica se há estoque disponível
        if medicamento.quantidade_estoque <= 0:
            return Response(
                {'error': 'Estoque do medicamento zerado.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrementa o estoque e salva
        medicamento.quantidade_estoque -= 1
        medicamento.save()

        # Prepara os dados para o log de administração
        log_data = {
            "prescricao": prescricao,
            "usuario_responsavel": request.user,
            "status": request.data.get('status', LogAdministracao.StatusDose.ADMINISTRADO),
            "observacoes": request.data.get('observacoes', '')
        }

        # Permite registrar com uma data/hora customizada (para registros retroativos)
        custom_datetime_str = request.data.get('data_hora_administracao')
        if custom_datetime_str:
            try:
                custom_datetime = parse_datetime(custom_datetime_str)
                if not custom_datetime: # parse_datetime retorna None para strings inválidas
                    raise ValueError
                log_data['data_hora_administracao'] = custom_datetime
            except (ValueError, TypeError):
                return Response(
                    {'error': 'O formato de data_hora_administracao é inválido. Use o formato ISO (ex: YYYY-MM-DDTHH:MM:SSZ).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Cria o registro de log
        log = LogAdministracao.objects.create(**log_data)

        log_serializer = LogAdministracaoSerializer(log)
        return Response(log_serializer.data, status=status.HTTP_201_CREATED)
    
class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar os usuários (membros) de um grupo específico.
    Acessado via URL aninhada: /api/grupos/{grupo_pk}/usuarios/
    """
    serializer_class = PerfilUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get_queryset(self):
        """Filtra os perfis de usuário para retornar apenas os membros do grupo especificado."""
        grupo_pk = self.kwargs.get('grupo_pk')
        if grupo_pk:
            grupo = get_object_or_404(Grupo, pk=grupo_pk)
            # 'membros' é o related_name do ManyToManyField 'grupos' em PerfilUsuario
            return grupo.membros.all()
        return PerfilUsuario.objects.none()

    @action(
        detail=True, 
        methods=['post'], 
        url_path='vincular-idoso',
        permission_classes=[IsGroupMember] # Apenas membros do grupo podem vincular
    )
    def vincular_idoso(self, request, pk=None, grupo_pk=None):
        """
        Ação para vincular um usuário (membro do grupo) como responsável por um idoso.
        URL: /api/grupos/{grupo_pk}/usuarios/{pk}/vincular-idoso/
        """
        perfil_usuario_alvo = self.get_object() # O usuário a ser vinculado
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Garante que o idoso pertence ao mesmo grupo
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        perfil_usuario_alvo.responsaveis.add(idoso)
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)

    @action(
        detail=True, 
        methods=['post'], 
        url_path='desvincular-idoso',
        permission_classes=[IsGroupMember] # Apenas membros do grupo podem desvincular
    )
    def desvincular_idoso(self, request, pk=None, grupo_pk=None):
        """
        Ação para remover o vínculo de responsabilidade entre um usuário e um idoso.
        URL: /api/grupos/{grupo_pk}/usuarios/{pk}/desvincular-idoso/
        """
        perfil_usuario_alvo = self.get_object()
        idoso_id = request.data.get('idoso_id')

        if not idoso_id:
            return Response({'error': 'O idoso_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Garante que o idoso pertence ao mesmo grupo
        idoso = get_object_or_404(Idoso, pk=idoso_id, grupo_id=grupo_pk)
        perfil_usuario_alvo.responsaveis.remove(idoso)
        return Response(self.get_serializer(perfil_usuario_alvo).data, status=status.HTTP_200_OK)