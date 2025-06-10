# Crie este novo arquivo: api/permissions.py

from rest_framework import permissions

class IsGroupMember(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são membros do grupo
    ao qual o objeto pertence.
    """
    def has_object_permission(self, request, view, obj):
        # Se o usuário não tiver um perfil ou um grupo, negue o acesso.
        if not hasattr(request.user, 'perfil') or not request.user.perfil.grupo:
            return False
        
        # O objeto (ex: um Idoso) tem um campo 'grupo'.
        # Verificamos se o grupo do objeto é o mesmo do usuário.
        if hasattr(obj, 'grupo'):
            return obj.grupo == request.user.perfil.grupo
        
        # Se o próprio objeto for um Grupo.
        return obj == request.user.perfil.grupo


class IsGroupAdmin(permissions.BasePermission):
    """
    Permite acesso apenas ao administrador do grupo.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if  view.action  == 'meu_grupo':
            if not hasattr(request.user, 'perfil') or not request.user.perfil.grupo:
                return False
            return request.user.perfil.grupo.admin == request.user
        return True


    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'perfil') or not request.user.perfil.grupo:
            return False

        # Verifica se o usuário logado é o admin do grupo do objeto.
        if hasattr(obj, 'grupo'):
            return request.user == obj.grupo.admin
        
        # Se o próprio objeto for um Grupo.
        return request.user == obj.admin