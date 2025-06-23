# api/permissions.py
from rest_framework import permissions
from .models import Grupo, PerfilUsuario, LogAdministracao, Prescricao

class IsGroupAdmin(permissions.BasePermission):
    """
    Permissão customizada que verifica se o usuário é o admin de um grupo.
    """
    message = 'Apenas o administrador do grupo pode realizar esta ação.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        target_group = None
        
        # Lógica centralizada para encontrar o grupo associado ao objeto
        if isinstance(obj, Grupo):
            target_group = obj
        elif isinstance(obj, Prescricao):
            if obj.idoso:
                target_group = obj.idoso.grupo
        elif isinstance(obj, LogAdministracao):
            if obj.prescricao and obj.prescricao.idoso:
                target_group = obj.prescricao.idoso.grupo
        elif hasattr(obj, 'grupo'): # Para Idoso e Medicamento
            target_group = obj.grupo
        
        # Se um grupo foi encontrado, verifica se o usuário é o admin
        if target_group:
            return target_group.admin == request.user
        
        return False


class IsGroupMember(permissions.BasePermission):
    """
    Permissão customizada que permite acesso apenas a usuários que são membros
    de um grupo específico.
    """
    message = 'Você não é membro deste grupo.'
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if 'grupo_pk' in view.kwargs:
            grupo_pk = view.kwargs['grupo_pk']
            return request.user.perfil.grupos.filter(pk=grupo_pk).exists()
        return True

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'perfil'):
            return False
            
        user_groups = request.user.perfil.grupos.all()
        target_group = None

        if isinstance(obj, Grupo):
            target_group = obj
        elif isinstance(obj, PerfilUsuario):
            return obj.grupos.filter(pk__in=[g.pk for g in user_groups]).exists()
        elif isinstance(obj, Prescricao): # Verifica Prescricao primeiro
            if obj.idoso:
                target_group = obj.idoso.grupo
        elif isinstance(obj, LogAdministracao): # Depois verifica LogAdministracao
            if obj.prescricao and obj.prescricao.idoso:
                target_group = obj.prescricao.idoso.grupo
        elif hasattr(obj, 'grupo'): # Cobre Idoso e Medicamento
            target_group = obj.grupo
        
        if not target_group:
            return False

        return target_group in user_groups
