# api/permissions.py
from rest_framework import permissions
from .models import Grupo, PerfilUsuario

class IsGroupAdmin(permissions.BasePermission):
    """
    Permissão customizada que verifica se o usuário é o admin de um grupo.
    Aplica-se a nível de objeto.
    """
    message = 'Apenas o administrador do grupo pode realizar esta ação.'

    def has_permission(self, request, view):
        # A verificação básica de autenticação é suficiente aqui.
        # A lógica principal será no has_object_permission.
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # A verificação é se o usuário da requisição é o admin do grupo.
        # O 'obj' aqui será a instância do Grupo.
        if isinstance(obj, Grupo):
            return obj.admin == request.user
        return False


class IsGroupMember(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são membros do grupo
    especificado na URL (para listas) ou no objeto (para detalhes).
    """
    message = 'Você não é membro deste grupo.'
    
    def has_permission(self, request, view):
        """
        Verifica a permissão a nível da view/lista, usando o grupo da URL.
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Para rotas aninhadas que passam 'grupo_pk' na URL
        if 'grupo_pk' in view.kwargs:
            grupo_pk = view.kwargs['grupo_pk']
            # Verifica se o usuário autenticado pertence ao grupo da URL
            return request.user.perfil.grupos.filter(pk=grupo_pk).exists()
        
        # Para rotas não aninhadas (como /api/grupos/{pk}/), a verificação
        # será feita a nível de objeto em `has_object_permission`.
        return True

    def has_object_permission(self, request, view, obj):
        """
        Verifica a permissão a nível de objeto (detalhe, update, delete).
        """
        if not hasattr(request.user, 'perfil'):
            return False
            
        # Pega a lista de todos os grupos do usuário logado
        user_groups = request.user.perfil.grupos.all()

        # Encontra o grupo associado ao objeto que está sendo acessado
        target_group = None
        if isinstance(obj, Grupo):
            target_group = obj
        elif isinstance(obj, PerfilUsuario): # Se o objeto for um perfil de usuário
            # A permissão é concedida se houver qualquer grupo em comum
            return obj.grupos.filter(pk__in=[g.pk for g in user_groups]).exists()
        elif hasattr(obj, 'grupo'):
            target_group = obj.grupo
        elif hasattr(obj, 'idoso') and hasattr(obj.idoso, 'grupo'):
            target_group = obj.idoso.grupo
        
        if not target_group:
            return False

        # A verificação principal: o grupo do objeto está na lista de grupos do usuário?
        return target_group in user_groups