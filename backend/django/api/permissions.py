
from rest_framework import permissions
from .models import Grupo, PerfilUsuario

class IsGroupAdmin(permissions.BasePermission):
    """
    Permissão customizada que verifica se o usuário é o admin de um grupo.
    """

    def has_permission(self, request, view):

        
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == 'meu_grupo':
            if not hasattr(request.user, 'perfil') or not request.user.perfil.grupo:
                return False
            
            is_admin = request.user == request.user.perfil.grupo.admin
            return is_admin
        
        return True

    def has_object_permission(self, request, view, obj):

        if not hasattr(request.user, 'perfil'):
            return False

        grupo = obj if isinstance(obj, Grupo) else getattr(obj, 'grupo', None)
        
        if not grupo:
             return False

        is_admin = request.user == grupo.admin
        
        return is_admin


class IsGroupMember(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são membros do grupo
    especificado na URL (para listas) ou no objeto (para detalhes).
    """
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
        
        # Permite o acesso a rotas não aninhadas (como /api/grupos/)
        # desde que o usuário esteja logado.
        return True

    def has_object_permission(self, request, view, obj):
        """
        Verifica a permissão a nível de objeto (detalhe, update, delete).
        """
        # Pega a lista de todos os grupos do usuário logado
        user_groups = request.user.perfil.grupos.all()

        # Encontra o grupo associado ao objeto que está sendo acessado
        target_group = None
        if isinstance(obj, Grupo):
            target_group = obj
        elif isinstance(obj, PerfilUsuario): # Se o objeto for um perfil de usuário
            # A permissão é concedida se houver qualquer grupo em comum
            return obj.grupos.filter(pk__in=user_groups).exists()
        elif hasattr(obj, 'grupo'):
            target_group = obj.grupo
        elif hasattr(obj, 'idoso') and hasattr(obj.idoso, 'grupo'):
            target_group = obj.idoso.grupo
        
        if not target_group:
            return False

        # A verificação principal: o grupo do objeto está na lista de grupos do usuário?
        return target_group in user_groups

