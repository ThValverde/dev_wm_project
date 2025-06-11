# api/services.py

from .models import PerfilUsuario, Notificacao

def enviar_notificacao_push(user_id: int, titulo: str, corpo: str):
    """
    Envia uma notificação push e a salva no banco de dados.
    """
    try:
        perfil = PerfilUsuario.objects.get(user__id=user_id)
        
        # Lógica de simulação de PUSH (substitua pela real)
        if perfil.device_token:
            print(f"SIMULANDO PUSH para {perfil.user.email} (Token: {perfil.device_token})")
            print(f"  Título: {titulo}")
            print(f"  Corpo: {corpo}")
        
        # Salva a notificação no banco de dados
        Notificacao.objects.create(
            destinatario=perfil.user,
            titulo=titulo,
            corpo=corpo
        )

    except PerfilUsuario.DoesNotExist:
        print(f"ERRO: Perfil para user_id {user_id} não encontrado.")