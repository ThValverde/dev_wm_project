# -*- coding: utf-8 -*-

from django.db import models
import uuid
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
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

    def __str__(self):
        # SUGESTÃO: Pequena melhoria para o caso de dosagem não ser preenchida.
        dosagem_str = f" ({self.dosagem_valor}{self.dosagem_unidade})" if self.dosagem_valor and self.dosagem_unidade else ""
        return f"{self.nome}{dosagem_str}"

# 6. Modelo para Administração de Medicamentos
class AdministracaoMedicamento(models.Model):
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name="medicacoes")
    # CORREÇÃO: Removida a definição duplicada do campo 'medicamento'.
    medicamento = models.ForeignKey(Medicamento, on_delete=models.PROTECT)
    horario_previsto = models.DateTimeField()
    foi_administrado = models.BooleanField(default=False)
    nao_tomou_motivo = models.CharField(max_length=255, blank=True, null=True, help_text="Preencher se o idoso não tomou o medicamento (NT)")
    enfermeiro_responsavel = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    data_hora_administracao = models.DateTimeField(null=True, blank=True, help_text="Horário exato em que foi administrado")

    class Meta:
        verbose_name = "Administração de Medicamento"
        verbose_name_plural = "Administrações de Medicamentos"
        ordering = ['horario_previsto']

    def __str__(self):
        status = "Administrado" if self.foi_administrado else "Pendente"
        return f"{self.medicamento.nome} para {self.idoso.nome_completo} em {self.horario_previsto.strftime('%d/%m/%Y %H:%M')} ({status})"
    
    
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