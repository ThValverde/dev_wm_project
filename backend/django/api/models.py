# api/models.py

from django.db import models        #módulo de modelos do Django para definir os modelos de dados
import uuid                 #módulo uuid 
from django.conf import settings    #importa as configurações do django
from django.db.models.signals import post_save  #importa o sinal post_save 
from django.dispatch import receiver    #importa o receptor 

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin # Importa classes base para criar um modelo de usuário personalizado.
# AbstractBaseUser fornece funcionalidades básicas de autenticação
# BaseUserManager é usado para criar um gerenciador de usuários personalizado
# PermissionsMixin adiciona campos e métodos relacionados a permissões e grupos de usuários

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
    codigo_acesso = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name="Código de Acesso do Grupo")
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
    grupos = models.ManyToManyField(
        Grupo,
        related_name="membros", # <-- CORREÇÃO: 'related_name' alterado para 'membros' para corresponder ao serializer
        blank=True,
        verbose_name="Grupos do Usuário"
    )
    permissao = models.CharField(max_length=10, choices=Permissao.choices, default=Permissao.MEMBRO)
    responsaveis = models.ManyToManyField(
        "Idoso", #####
        related_name =  'cuidadores',
        blank=True,
        verbose_name='Idosos Responsáveis'
    )
    def __str__(self):
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
        SUL_AMERICA = 'SUL', 'Sul América Saúde'
        AMIL = 'AMI', 'Amil Saúde'
        NOTREDAME = 'NOT', 'NotreDame Intermédica'
        OUTRO = 'OUT', 'Outro'

    possui_plano_saude = models.BooleanField(verbose_name="Possui plano de saúde?", default=False)
    plano_saude = models.CharField(verbose_name="Plano de Saúde", max_length=3, choices=OpcoesPlanoSaude.choices, null=True, blank=True)
    plano_saude_outro = models.CharField(verbose_name="Qual outro plano?", max_length=100, null=True, blank=True)
    numero_carteirinha_plano = models.CharField(verbose_name="Número da Carteirinha (Plano de Saúde)", max_length=50, null=True, blank=True)
    
    doencas = models.TextField(verbose_name="Doenças", blank=True, help_text="Doenças pré-existentes")
    condicoes = models.TextField(verbose_name="Condições", blank=True, help_text="Condições especiais ou alergias")

    class Meta:
        
        constraints = [
            models.UniqueConstraint(fields=['grupo', 'cpf'], name='unique_cpf_por_grupo'),
            models.UniqueConstraint(fields=['grupo', 'rg'], name='unique_rg_por_grupo'),
            models.UniqueConstraint(fields=['grupo', 'cartao_sus'], name='unique_sus_por_grupo'),
        ]

    def __str__(self):
        return self.nome_completo

# 4. Modelo para Contato de Parente 
class ContatoParente(models.Model):
    
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name='contatos')
    
    class ParentescoChoices(models.TextChoices):
        FILHO_A = 'FI', 'Filho(a)'
        NETO_A = 'NE', 'Neto(a)'
        IRMAO_A = 'IR', 'Irmão(ã)'
        PAI_MAE = 'PA', 'Pai/Mãe'
        AVO_A = 'AV', 'Avô/Avó'
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
   
    class OpcoesFormaFarmaceutica(models.TextChoices):
        COMPRIMIDO = 'COMP', 'Comprimido'
        CAPSULA = 'CAP', 'Cápsula'
        LIQUIDO_ML = 'LIQ_ML', 'Líquido (ml)'
        CREME_G = 'CREME_G', 'Creme (g)'
        GOTA = 'GOTA', 'Gota'
        OUTRO = 'OUT', 'Outro'

    class OpcoesConcentracaoUnidade(models.TextChoices):
        
        MICROGRAMA_POR_GRAMA = 'mcg/g', 'mcg/g'
        MILIGRAMA_POR_GRAMA = 'mg/g', 'mg/g'
        MG_POR_ML = 'mg/ml', 'mg/ml'
        UNIDADE = 'UN', 'Unidade'
        OUTRO = 'OUT', 'Outro'

    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='medicamentos')
    
    #campo para o nome comercial 
    nome_marca = models.CharField(
        verbose_name="Nome", 
        max_length=200, 
        unique=True,
        help_text="Nome comercial do medicamento. Se for genérico, pode repetir o princípio ativo."
    )
    #campo para o princípio ativo (ex: Paracetamol, Cloridrato de Paroxetina)
    principio_ativo = models.CharField(
        verbose_name="Princípio Ativo", 
        blank=True,
        max_length=200
    )
    #caixa de seleção Sim/Não
    generico = models.BooleanField(
        verbose_name="É Genérico?", 
        default=False
    )
    # campo de texto para o laboratório
    fabricante = models.CharField(
        verbose_name="Fabricante/Laboratório", 
        max_length=100, 
        blank=True
    )
    #campo para o valor da concentração 
    concentracao_valor = models.DecimalField(
        verbose_name="Concentração (Valor)",
        max_digits=10, 
        decimal_places=2,
        null=True, blank=True
    )
    #caixa de seleção para a unidade da concentração
    concentracao_unidade = models.CharField(
        verbose_name="Unidade de Concentração",
        max_length=5,
        choices=OpcoesConcentracaoUnidade.choices,
        null=True, blank=True
    )
    #caixa de seleção para a forma do medicamento
    forma_farmaceutica = models.CharField(
        verbose_name="Forma Farmacêutica",
        max_length=10,
        choices=OpcoesFormaFarmaceutica.choices
    )
    #campo para o estoque
    quantidade_estoque = models.PositiveIntegerField(
        verbose_name="Quantidade em Estoque (Embalagens)", 
        default=0, 
        help_text="Número de caixas/frascos em estoque."
    )
    
    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Medicamentos"
        
        constraints = [
            models.UniqueConstraint(
                fields=['grupo', 'nome_marca', 'principio_ativo', 'concentracao_valor', 'concentracao_unidade'], 
                name='unique_medicamento_no_grupo'
            )
        ]

    def __str__(self):

        concentracao = ""
        if self.concentracao_valor and self.concentracao_unidade:
            
            valor_str = int(self.concentracao_valor) if self.concentracao_valor.to_integral_value() == self.concentracao_valor else self.concentracao_valor
            concentracao = f" {valor_str}{self.get_concentracao_unidade_display()}"
        
        return f"{self.nome_marca} ({self.principio_ativo}){concentracao}"
    
    
# 6. Modelo para Prescricao de Medicamentos
class Prescricao(models.Model):
    class FrequenciaChoices(models.TextChoices):
        DIARIA = 'DI', 'Diária'
        SEMANAL = 'SE', 'Semanal'
        MENSAL = 'ME', 'Mensal'
        EVENTUAL = 'EV', 'Eventual'
    frequencia = models.CharField(
        max_length=2, 
        choices=FrequenciaChoices.choices, 
        default=FrequenciaChoices.DIARIA,
        verbose_name="Frequência da Dose"
    )
    dia_domingo = models.BooleanField(default=False, verbose_name="Domingo")
    dia_segunda = models.BooleanField(default=False, verbose_name="Segunda-feira")
    dia_terca = models.BooleanField(default=False, verbose_name="Terça-feira")
    dia_quarta = models.BooleanField(default=False, verbose_name="Quarta-feira")
    dia_quinta = models.BooleanField(default=False, verbose_name="Quinta-feira")
    dia_sexta = models.BooleanField(default=False, verbose_name="Sexta-feira")
    dia_sabado = models.BooleanField(default=False, verbose_name="Sábado")
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

    def __str__(self):
        # CORREÇÃO: Removida a referência ao campo 'foi_administrado' que não existe.
        return f"{self.medicamento.nome_marca} para {self.idoso.nome_completo} às {self.horario_previsto.strftime('%H:%M')}"

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
        return f"Dose de {self.prescricao.medicamento.nome_marca} para {self.prescricao.idoso.nome_completo} em {self.data_hora_administracao.strftime('%d/%m/%y %H:%M')}"
    
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def criar_perfil_usuario_apos_criar_usuario(sender, instance, created, **kwargs):
    """
    Cria um PerfilUsuario automaticamente sempre que um novo usuário (Usuario) é criado.
    """
    if created:
        PerfilUsuario.objects.create(user=instance)


@receiver(post_save, sender=Grupo)
def criar_grupo(sender, instance, created, **kwargs):
    if created:
        print(f"Grupo criado: {instance.nome}")