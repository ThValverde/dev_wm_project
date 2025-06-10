# Crie este novo arquivo: api/permissions.py

from rest_framework import permissions
from .models import Grupo

class IsGroupAdmin(permissions.BasePermission):
    """
    Permissão customizada que verifica se o usuário é o admin de um grupo.
    """

    def has_permission(self, request, view):
        # Este print nos mostra se a classe de permissão foi chamada
        #print(f"\n--- DENTRO DE IsGroupAdmin: has_permission ---")
        #print(f"Ação da View: {view.action}")
        #print(f"Usuário: {request.user}")
        
        # A lógica original continua a mesma
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action == 'meu_grupo':
            if not hasattr(request.user, 'perfil') or not request.user.perfil.grupo:
                return False
            
            is_admin = request.user == request.user.perfil.grupo.admin
            #print(f"Verificando 'meu_grupo'. O usuário é admin? {is_admin}")
            return is_admin
        
        #print("has_permission passou, prosseguindo para a verificação de objeto (se aplicável)...")
        return True

    def has_object_permission(self, request, view, obj):
        # Este print nos mostra se a verificação a nível de objeto foi chamada
        #print(f"\n--- DENTRO DE IsGroupAdmin: has_object_permission ---")
        #print(f"Objeto sendo verificado: {obj}")
        #print(f"Usuário: {request.user}")

        if not hasattr(request.user, 'perfil'):
            return False

        grupo = obj if isinstance(obj, Grupo) else getattr(obj, 'grupo', None)
        
        if not grupo:
             return False

        is_admin = request.user == grupo.admin
        #print(f"Verificando permissão no objeto. O usuário é admin? {is_admin}")
        return is_admin


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