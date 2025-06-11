
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Prescricao, LogAdministracao
from .services import enviar_notificacao_push

@shared_task
def verificar_prescricoes_e_notificar():
    """
    Tarefa do Celery para verificar prescrições e notificar cuidadores.
    """
    agora = timezone.now()
    limite_futuro = agora + timedelta(minutes=5)

    prescricoes_no_horario = Prescricao.objects.filter(
        ativo=True,
        horario_previsto__gte=agora.time(),
        horario_previsto__lte=limite_futuro.time()
    )

    for prescricao in prescricoes_no_horario:
        log_recente_existe = LogAdministracao.objects.filter(
            prescricao=prescricao,
            data_hora_administracao__date=agora.date()
        ).exists()

        if log_recente_existe:
            continue

        idoso = prescricao.idoso
        cuidadores = idoso.cuidadores.all() # Usa o related_name de PerfilUsuario.responsaveis

        titulo = f"Hora do Remédio: {idoso.nome_completo}"
        corpo = f"Administrar {prescricao.dosagem} de {prescricao.medicamento.nome} às {prescricao.horario_previsto.strftime('%H:%M')}."

        for cuidador in cuidadores:
            enviar_notificacao_push(
                user_id=cuidador.user.id,
                titulo=titulo,
                corpo=corpo
            )