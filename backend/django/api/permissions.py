# api/permissions.py
from rest_framework import permissions
from .models import Grupo, PerfilUsuario

class IsGroupAdmin(permissions.BasePermission):
    """
    Permissão customizada que verifica se o usuário é o admin de um grupo.
    Aplica-se a nível de objeto, ou seja, para ações de detalhe, atualização e exclusão.
    """
    # Mensagem de erro a ser exibida se a permissão for negada.
    message = 'Apenas o administrador do grupo pode realizar esta ação.'

    def has_permission(self, request, view):
        """
        Verifica a permissão a nível de view (lista).
        Apenas verifica se o usuário está autenticado, pois a verificação de admin
        depende de um objeto específico (o grupo).
        """
        # Garante que o usuário esteja logado para qualquer tipo de acesso.
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Verifica a permissão a nível de objeto.
        'obj' é a instância do modelo que está sendo acessada (ex: um Grupo).
        """
        # Verifica se o objeto sendo acessado é uma instância de Grupo.
        if isinstance(obj, Grupo):
            # Retorna True se o usuário da requisição for o admin do grupo.
            return obj.admin == request.user
        # Se o objeto não for um Grupo, nega a permissão.
        return False


class IsGroupMember(permissions.BasePermission):
    """
    Permissão customizada que permite acesso apenas a usuários que são membros
    de um grupo específico. Funciona tanto para listas (usando 'grupo_pk' da URL)
    quanto para objetos individuais.
    """
    # Mensagem de erro a ser exibida se a permissão for negada.
    message = 'Você não é membro deste grupo.'
    
    def has_permission(self, request, view):
        """
        Verifica a permissão a nível da view/lista, geralmente usando um 'grupo_pk' da URL.
        Isso é útil para endpoints aninhados como /api/grupos/{grupo_pk}/idosos/.
        """
        # Primeiro, garante que o usuário esteja autenticado.
        if not request.user or not request.user.is_authenticated:
            return False

        # Verifica se 'grupo_pk' (chave primária do grupo) está nos parâmetros da URL.
        if 'grupo_pk' in view.kwargs:
            grupo_pk = view.kwargs['grupo_pk']
            # Verifica se o perfil do usuário autenticado está associado ao grupo especificado na URL.
            return request.user.perfil.grupos.filter(pk=grupo_pk).exists()
        
        # Se 'grupo_pk' não estiver na URL (ex: /api/grupos/{pk}/),
        # a verificação será feita a nível de objeto em `has_object_permission`.
        # Retorna True para permitir que a verificação continue.
        return True

    def has_object_permission(self, request, view, obj):
        """
        Verifica a permissão a nível de objeto (para detalhe, update, delete).
        'obj' é a instância do modelo que está sendo acessada.
        """
        # Se o usuário não tiver um perfil associado, não pode ser membro de nenhum grupo.
        if not hasattr(request.user, 'perfil'):
            return False
            
        # Obtém a lista de todos os grupos aos quais o usuário logado pertence.
        user_groups = request.user.perfil.grupos.all()

        # Determina a qual grupo o objeto ('obj') que está sendo acessado pertence.
        target_group = None
        if isinstance(obj, Grupo):
            # Se o objeto for o próprio Grupo.
            target_group = obj
        elif isinstance(obj, PerfilUsuario): 
            # Se o objeto for um PerfilUsuario, verifica se o perfil alvo e o perfil do usuário
            # têm algum grupo em comum.
            return obj.grupos.filter(pk__in=[g.pk for g in user_groups]).exists()
        elif hasattr(obj, 'grupo'):
            # Se o objeto tem uma relação direta com um grupo (ex: Idoso).
            target_group = obj.grupo
        elif hasattr(obj, 'idoso') and hasattr(obj.idoso, 'grupo'):
            # Se o objeto tem uma relação indireta com um grupo através de um idoso (ex: Medicamento, ContatoParente).
            target_group = obj.idoso.grupo
        
        # Se não foi possível determinar o grupo do objeto, nega o acesso.
        if not target_group:
            return False

        # A verificação final: o grupo do objeto está na lista de grupos do usuário?
        return target_group in user_groups