
from rest_framework import permissions
from .models import Grupo

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
    ao qual o objeto (ou o objeto pai) pertence.
    """
    def has_permission(self, request, view):
        """
        Verificação a nível de lista. Garante que o usuário
        está logado e pertence a um grupo antes de prosseguir.
        """
        return request.user and request.user.is_authenticated and hasattr(request.user, 'perfil') and request.user.perfil.grupo is not None

    def has_object_permission(self, request, view, obj):
        """
        Verificação a nível de objeto. Lida com diferentes tipos de objetos.
        """
        user_group = request.user.perfil.grupo

        # Caso 1: O objeto é o próprio Grupo
        if isinstance(obj, Grupo):
            return obj == user_group

        # Caso 2: O objeto tem um link direto para o grupo (ex: Idoso, Medicamento)
        if hasattr(obj, 'grupo'):
            return obj.grupo == user_group

        # Caso 3: O objeto é uma Prescricao (tem um link para Idoso)
        if hasattr(obj, 'idoso') and hasattr(obj.idoso, 'grupo'):
            return obj.idoso.grupo == user_group
        
        # Caso 4: O objeto é um LogAdministracao (tem um link para Prescricao)
        if hasattr(obj, 'prescricao') and hasattr(obj.prescricao.idoso, 'grupo'):
            return obj.prescricao.idoso.grupo == user_group

        # Se nenhuma das condições acima for atendida, nega o acesso por padrão.
        return False