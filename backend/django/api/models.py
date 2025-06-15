# models.py - Responsável por definir os modelos de dados do Django para o sistema de gerenciamento de idosos.
# Modelos correspondem às tabelas do banco de dados e definem a estrutura dos dados.
from django.db import models        # Importa o módulo de modelos do Django para definir os modelos de dados.
import uuid                 # Importa o módulo uuid para gerar identificadores únicos universais (UUIDs).
from django.conf import settings    # Importa as configurações do Django, especialmente o modelo de usuário personalizado.
from django.db.models.signals import post_save  # Importa o sinal post_save para executar ações após salvar um modelo.
from django.dispatch import receiver    # Importa o receptor para conectar sinais a funções específicas.

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin # Importa classes base para criar um modelo de usuário personalizado.
# AbstractBaseUser fornece funcionalidades básicas de autenticação,
# BaseUserManager é usado para criar um gerenciador de usuários personalizado,
# PermissionsMixin adiciona campos e métodos relacionados a permissões e grupos de usuários.
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    """
    Gerenciador para o nosso modelo de usuário personalizado onde o email é o
    identificador único para autenticação.
    """
    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('O campo de Email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Nosso modelo de Usuário personalizado que usa e-mail para login.
    """
    email = models.EmailField('endereço de e-mail', unique=True)
    nome_completo = models.CharField(max_length=150, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome_completo']

    objects = CustomUserManager()

    def __str__(self):
        return self.email



# 1. Modelo para o Grupo
class Grupo(models.Model):
    nome = models.CharField(max_length=100, verbose_name="Nome do Grupo", unique=True, help_text="Nome da casa de idosos")
    senha_hash = models.CharField(max_length=128)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='grupos_administrados', 
        verbose_name="Administrador do Grupo"
    )
    codigo_acesso = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, unique_for_date = True, verbose_name="Código de Acesso do Grupo")
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação do Grupo")
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização do Grupo")

    def __str__(self):
        return self.nome

# 2. Modelo para o Perfil do Usuário
class PerfilUsuario(models.Model):
    class Permissao(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        MEMBRO = 'MEMBRO', 'Membro'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil")
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True, related_name="membros")
    permissao = models.CharField(max_length=10, choices=Permissao.choices, default=Permissao.MEMBRO)
    responsaveis = models.ManyToManyField(
        "Idoso", #####
        related_name =  'cuidadores',
        blank=True,
        verbose_name='Idosos Responsáveis'
    )
    device_token = models.CharField(max_length=255, null=True, blank=True, verbose_name="Token do Dispositivo para Notificação")

    def __str__(self):
        # SUGESTÃO: Usar o e-mail ou str(self.user) é mais seguro com modelos de usuário customizados.
        return str(self.user)

# 3. Modelo para o Idoso
class Idoso(models.Model):
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='idosos_da_casa')
    
    class OpcoesGenero(models.TextChoices):
        MASCULINO = 'M', 'Masculino'
        FEMININO = 'F', 'Feminino'
        OUTRO = 'O', 'Outro / Não informar'
    
    nome_completo = models.CharField(max_length=255)
    data_nascimento = models.DateField()
    peso = models.DecimalField(max_digits=5, decimal_places=2, help_text="Peso em kg")
    genero = models.CharField(verbose_name="Gênero", max_length=1, choices=OpcoesGenero.choices)
    cpf = models.CharField(verbose_name="CPF", max_length=11)    
    rg = models.CharField(verbose_name="RG", max_length=9, null=True, blank=True)
    cartao_sus = models.CharField(verbose_name="Cartão Nacional de Saúde (CNS)", max_length=20)
    
    class OpcoesPlanoSaude(models.TextChoices):
        BRADESCO = 'BRA', 'Bradesco Saúde'
        UNIMED = 'UNI', 'Unimed'
        # ... outras opções
        OUTRO = 'OUT', 'Outro'

    possui_plano_saude = models.BooleanField(verbose_name="Possui plano de saúde?", default=False)
    plano_saude = models.CharField(verbose_name="Plano de Saúde", max_length=3, choices=OpcoesPlanoSaude.choices, null=True, blank=True)
    plano_saude_outro = models.CharField(verbose_name="Qual outro plano?", max_length=100, null=True, blank=True)
    numero_carteirinha_plano = models.CharField(verbose_name="Número da Carteirinha (Plano de Saúde)", max_length=50, null=True, blank=True)
    
    doencas = models.TextField(verbose_name="Doenças", blank=True, help_text="Doenças pré-existentes")
    condicoes = models.TextField(verbose_name="Condições", blank=True, help_text="Condições especiais ou alergias")

    class Meta:
        # SUGESTÃO: Garante que o CPF, RG, etc. sejam únicos por grupo, não no sistema inteiro.
        constraints = [
            models.UniqueConstraint(fields=['grupo', 'cpf'], name='unique_cpf_por_grupo'),
            models.UniqueConstraint(fields=['grupo', 'rg'], name='unique_rg_por_grupo'),
            models.UniqueConstraint(fields=['grupo', 'cartao_sus'], name='unique_sus_por_grupo'),
        ]

    def __str__(self):
        return self.nome_completo

# 4. Modelo para Contato de Parente 
class ContatoParente(models.Model):
    # CORREÇÃO: Removida a definição duplicada do campo 'idoso'.
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name='contatos')
    
    class ParentescoChoices(models.TextChoices):
        FILHO_A = 'FI', 'Filho(a)'
        NETO_A = 'NE', 'Neto(a)'
        # ... outras opções
        OUTRO = 'OU', 'Outro'

    nome = models.CharField(verbose_name="Nome do Parente", max_length=255)
    parentesco = models.CharField(verbose_name="Parentesco", max_length=2, choices=ParentescoChoices.choices)
    telefone = models.CharField(verbose_name="Telefone", max_length=20, blank=True)
    email = models.EmailField(verbose_name="E-mail", blank=True)

    class Meta:
        verbose_name = "Contato de Parente"
        verbose_name_plural = "Contatos de Parentes"

    def __str__(self):
        return f"{self.nome} ({self.get_parentesco_display()}) - Contato de {self.idoso.nome_completo}"

# 5. Modelo para Medicamento
class Medicamento(models.Model):
    # CORREÇÃO: O related_name foi alterado para 'medicamentos' para evitar conflito.
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='medicamentos')

    # ... classes de choices
    class OpcoesFormaFarmaceutica(models.TextChoices):
        COMPRIMIDO = 'COMP', 'Comprimido'
        CAPSULA = 'CAP', 'Cápsula'
        # ... outras opções
        OUTRO = 'OUT', 'Outro'

    nome = models.CharField(max_length=200)
    # ... outros campos do medicamento
    quantidade_estoque = models.PositiveIntegerField(verbose_name="Quantidade em Estoque (Embalagens)", default=0, help_text="Número de caixas/frascos em estoque.")
    
    class Meta:
        # SUGESTÃO: Garante que o nome do medicamento seja único por grupo.
        constraints = [
            models.UniqueConstraint(fields=['grupo', 'nome'], name='unique_medicamento_por_grupo')
        ]

    # def __str__(self):
    #     # SUGESTÃO: Pequena melhoria para o caso de dosagem não ser preenchida.
    #     dosagem_str = f" ({self.dosagem_valor}{self.dosagem_unidade})" if self.dosagem_valor and self.dosagem_unidade else ""
    #     return f"{self.nome}{dosagem_str}"

        
    # SUGESTÃO DE CORREÇÃO em models.py, dentro da class Medicamento
    def __str__(self):
        return self.nome

# 6. Modelo para Prescricao de Medicamentos
class Prescricao(models.Model):
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name="prescricoes")
    medicamento = models.ForeignKey(Medicamento, on_delete=models.PROTECT) # Proteger para não deletar um medicamento em uso
    horario_previsto = models.TimeField(verbose_name="Horário da Dose") # Ex: 08:00, 14:00, 22:00
    dosagem = models.CharField(max_length=100, help_text="Ex: 1 comprimido, 5ml, 2 gotas")
    instrucoes = models.TextField(blank=True, help_text="Ex: Administrar com alimentos.")
    ativo = models.BooleanField(default=True, help_text="Desmarque para suspender esta prescrição.")

    class Meta:
        verbose_name = "Prescrição"
        verbose_name_plural = "Prescrições"
        ordering = ['horario_previsto']

    # def __str__(self):
    #     status = "Administrado" if self.foi_administrado else "Pendente"
    #     return f"{self.medicamento.nome} para {self.idoso.nome_completo} às {self.horario_previsto.strftime('%H:%M')}"
    
    
    def __str__(self):
        return f"{self.medicamento.nome} para {self.idoso.nome_completo} às {self.horario_previsto.strftime('%H:%M')}"


# 7. Modelo para Registro de administração de Medicamento   

class LogAdministracao(models.Model):
    class StatusDose(models.TextChoices):
        ADMINISTRADO = 'OK', 'Administrado'
        RECUSADO = 'REC', 'Recusado pelo paciente'
        PULADO = 'PUL', 'Pulado/Esquecido'

    prescricao = models.ForeignKey(Prescricao, on_delete=models.CASCADE, related_name="logs_de_administracao")
    data_hora_administracao = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=3, choices=StatusDose.choices, default=StatusDose.ADMINISTRADO)
    usuario_responsavel = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    observacoes = models.TextField(blank=True)

    def __str__(self):
        return f"Dose de {self.prescricao.medicamento.nome} para {self.prescricao.idoso.nome_completo} em {self.data_hora_administracao.strftime('%d/%m/%y %H:%M')}"

# 8. Modelo para Notificações
class Notificacao(models.Model):
    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificacoes'
    )
    titulo = models.CharField(max_length=255)
    corpo = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)
    lida = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"
        ordering = ['-data_criacao']

    def __str__(self):
        status = "Lida" if self.lida else "Não Lida"
        return f"Para {self.destinatario.email}: {self.titulo} ({status})"
    
    
        
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def criar_perfil_usuario_apos_criar_usuario(sender, instance, created, **kwargs):
    """
    Cria um PerfilUsuario automaticamente sempre que um novo usuário (Usuario) é criado.
    """
    if created:
        PerfilUsuario.objects.create(user=instance)

# Os outros sinais são apenas para print, pode mantê-los se quiser
@receiver(post_save, sender=Grupo)
def criar_grupo(sender, instance, created, **kwargs):
    if created:
        print(f"Grupo criado: {instance.nome}")