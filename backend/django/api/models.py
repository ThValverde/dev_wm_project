# api/models.py - Este arquivo contém os modelos de dados do aplicativo API, que são usados para definir a estrutura do banco de dados e as relações entre os dados.

from django.db import models        #módulo de modelos do Django para definir os modelos de dados
import uuid                 #módulo uuid 
from django.conf import settings    #importa as configurações do django
from django.db.models.signals import post_save  #importa o sinal post_save 
from django.dispatch import receiver    #importa o receptor 

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin # Importa classes base para criar um modelo de usuário personalizado.
# AbstractBaseUser fornece funcionalidades básicas de autenticação
# BaseUserManager é usado para criar um gerenciador de usuários personalizado
# PermissionsMixin adiciona campos e métodos relacionados a permissões e grupos de usuários

from django.utils import timezone   # Importa timezone para manipulação de datas e horas no Django

class CustomUserManager(BaseUserManager):   
    """
    Gerenciador para o nosso modelo de usuário personalizado onde o email é o
    identificador único para autenticação.
    """
    def create_user(self, email, password, **extra_fields):     # Método para criar um usuário normal
        if not email:   # Verifica se o email foi fornecido
            raise ValueError('O campo de Email é obrigatório')  # Lança um erro se o email não for fornecido
        email = self.normalize_email(email) # Normaliza o email para garantir que esteja em um formato padrão
        user = self.model(email=email, **extra_fields)  # Cria uma instância do usuário com o email e outros campos extras
        user.set_password(password) # Define a senha do usuário usando o método set_password para garantir que seja criptografada
        user.save(using=self._db)   # Salva o usuário no banco de dados usando o gerenciador de banco de dados padrão
        return user 

    def create_superuser(self, email, password, **extra_fields):    # Método para criar um superusuário
        extra_fields.setdefault('is_staff', True)   # Define is_staff como True por padrão para superusuários
        extra_fields.setdefault('is_superuser', True)   # Define is_superuser como True por padrão para superusuários
        extra_fields.setdefault('is_active', True)  # Define is_active como True por padrão para superusuários

        if extra_fields.get('is_staff') is not True:    # Verifica se is_staff está definido como True
            raise ValueError('Superuser must have is_staff=True.')  # Lança um erro se is_staff não for True
        if extra_fields.get('is_superuser') is not True:    # Verifica se is_superuser está definido como True
            raise ValueError('Superuser must have is_superuser=True.')  # Lança um erro se is_superuser não for True

        return self.create_user(email, password, **extra_fields)    # Cria o superusuário usando o método create_user definido acima

class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Nosso modelo de Usuário personalizado que usa e-mail para login.
    """
    email = models.EmailField('endereço de e-mail', unique=True)    # Campo de email que será usado como identificador único para o usuário
    nome_completo = models.CharField(max_length=150, blank=True)    # Campo para o nome completo do usuário, pode ser deixado em branco
    is_staff = models.BooleanField(default=False)   # Campo para indicar se o usuário é um membro da equipe (pode acessar o admin)
    is_active = models.BooleanField(default=True)   # Campo para indicar se o usuário está ativo (pode fazer login)
    date_joined = models.DateTimeField(default=timezone.now)    # Campo para registrar a data e hora em que o usuário foi criado

    USERNAME_FIELD = 'email'    # Define o campo que será usado como identificador único para autenticação
    REQUIRED_FIELDS = ['nome_completo'] # Lista de campos obrigatórios além do email para criar um usuário

    objects = CustomUserManager()   # Define o gerenciador de usuários personalizado para este modelo

    def __str__(self):  # Método para retornar uma representação em string do usuário      
        return self.email   # Retorna o email do usuário como sua representação em string



# 1. Modelo para o Grupo
class Grupo(models.Model):  
    # Modelo para representar uma casa de idosos ou grupo de cuidadores
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name="ID do Grupo") # Campo para o ID único do grupo
    nome = models.CharField(max_length=100, verbose_name="Nome do Grupo", unique=False, help_text="Nome da casa de idosos") # Campo para o nome do grupo, deve ser único
    senha_hash = models.CharField(max_length=128)   # Campo para armazenar o hash da senha do grupo, usado para autenticação
    admin = models.ForeignKey(  # Campo para o usuário administrador do grupo, referenciando o modelo de usuário personalizado
        settings.AUTH_USER_MODEL,   # Usa o modelo de usuário personalizado definido em settings.AUTH_USER_MODEL
        on_delete=models.PROTECT,   # Protege o usuário administrador de ser deletado enquanto houver grupos associados
        related_name='grupos_administrados',    # Nome relacionado para acessar os grupos administrados pelo usuário
        verbose_name="Administrador do Grupo"   # Nome do campo no admin e na interface de usuário
    )
    codigo_acesso = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name="Código de Acesso do Grupo") # Campo para o código de acesso único do grupo, usado para autenticação
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação do Grupo") # Campo para registrar a data de criação do grupo, preenchido automaticamente
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name="Data de Atualização do Grupo") # Campo para registrar a data da última atualização do grupo, preenchido automaticamente
    
    endereco = models.CharField(max_length=255, blank=True, verbose_name="Endereço do Grupo", help_text="Endereço da casa de idosos")   # Campo para o endereço do grupo, pode ser deixado em branco
    telefone = models.CharField(max_length=20, blank=True, verbose_name="Telefone do Grupo", help_text="Telefone de contato da casa de idosos") # Campo para o telefone do grupo, pode ser deixado em branco
    cidade = models.CharField(max_length=100, blank=True, verbose_name="Cidade do Grupo", help_text="Cidade onde a casa de idosos está localizada") # Campo para a cidade do grupo, pode ser deixado em branco
    estado = models.CharField(max_length=100, blank=True, verbose_name="Estado do Grupo", help_text="Estado onde a casa de idosos está localizada") # Campo para o estado do grupo, pode ser deixado em branco
    cep = models.CharField(max_length=10, blank=True, verbose_name="CEP do Grupo", help_text="CEP da casa de idosos")   # Campo para o CEP do grupo, pode ser deixado em branco
    nome_responsavel = models.CharField(    # Campo para o nome do responsável pela casa de idosos
        max_length=100,
        blank=True,
        verbose_name="Nome do Responsável",
        help_text="Nome do responsável pela casa de idosos"
    )

    def __str__(self):  # Método para retornar uma representação em string do grupo
        return self.nome    # Retorna o nome do grupo como sua representação em string

# 2. Modelo para o Perfil do Usuário
class PerfilUsuario(models.Model):  
    # Classe interna para definir as opções de permissão do usuário
    class Permissao(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        MEMBRO = 'MEMBRO', 'Membro'

    # Relacionamento um-para-um com o modelo de usuário do Django
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil")
    # Relacionamento muitos-para-muitos com o modelo Grupo, permitindo que um usuário pertença a vários grupos
    grupos = models.ManyToManyField(
        Grupo,
        related_name="membros", # Nome para o relacionamento reverso, de Grupo para PerfilUsuario
        blank=True,
        verbose_name="Grupos do Usuário"
    )
    # Campo para definir o nível de permissão do usuário dentro de um grupo
    permissao = models.CharField(max_length=10, choices=Permissao.choices, default=Permissao.MEMBRO)
    # Relacionamento muitos-para-muitos com o modelo Idoso, indicando de quais idosos este usuário é responsável
    responsaveis = models.ManyToManyField(
        "Idoso",
        related_name =  'cuidadores', # Nome para o relacionamento reverso, de Idoso para PerfilUsuario
        blank=True,
        verbose_name='Idosos Responsáveis'
    )
    def __str__(self): # Método para retornar uma representação em string do perfil
        return str(self.user) # Retorna a representação em string do usuário associado

# 3. Modelo para o Idoso
class Idoso(models.Model):
    # Chave estrangeira para o Grupo, indicando a qual casa de idosos este idoso pertence
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='idosos_da_casa')
    
    # Classe interna para definir as opções de gênero
    class OpcoesGenero(models.TextChoices):
        MASCULINO = 'M', 'Masculino'
        FEMININO = 'F', 'Feminino'
        OUTRO = 'O', 'Outro / Não informar'
    
    nome_completo = models.CharField(max_length=255) # Campo para o nome completo do idoso
    data_nascimento = models.DateField() # Campo para a data de nascimento
    peso = models.DecimalField(max_digits=5, decimal_places=2, help_text="Peso em kg") # Campo para o peso em quilogramas
    genero = models.CharField(verbose_name="Gênero", max_length=1, choices=OpcoesGenero.choices) # Campo para o gênero
    cpf = models.CharField(verbose_name="CPF", max_length=11) # Campo para o CPF
    rg = models.CharField(verbose_name="RG", max_length=9, null=True, blank=True) # Campo para o RG, opcional
    cartao_sus = models.CharField(verbose_name="Cartão Nacional de Saúde (CNS)", max_length=20) # Campo para o Cartão SUS
    
    # Classe interna para definir as opções de plano de saúde
    class OpcoesPlanoSaude(models.TextChoices):
        BRADESCO = 'BRA', 'Bradesco Saúde'
        UNIMED = 'UNI', 'Unimed'
        SUL_AMERICA = 'SUL', 'Sul América Saúde'
        AMIL = 'AMI', 'Amil Saúde'
        NOTREDAME = 'NOT', 'NotreDame Intermédica'
        OUTRO = 'OUT', 'Outro'

    possui_plano_saude = models.BooleanField(verbose_name="Possui plano de saúde?", default=False) # Campo booleano para indicar se possui plano de saúde
    plano_saude = models.CharField(verbose_name="Plano de Saúde", max_length=3, choices=OpcoesPlanoSaude.choices, null=True, blank=True) # Campo para o nome do plano de saúde, opcional
    plano_saude_outro = models.CharField(verbose_name="Qual outro plano?", max_length=100, null=True, blank=True) # Campo para especificar outro plano de saúde, opcional
    numero_carteirinha_plano = models.CharField(verbose_name="Número da Carteirinha (Plano de Saúde)", max_length=50, null=True, blank=True) # Campo para o número da carteirinha do plano, opcional
    
    doencas = models.TextField(verbose_name="Doenças", blank=True, help_text="Doenças pré-existentes") # Campo de texto para doenças pré-existentes
    condicoes = models.TextField(verbose_name="Condições", blank=True, help_text="Condições especiais ou alergias") # Campo de texto para condições especiais e alergias

    class Meta:
        verbose_name = "Idoso"
        verbose_name_plural = "Idosos"
        ordering = ['nome_completo']
        # Restrições para garantir que CPF, RG e Cartão SUS sejam únicos dentro de cada grupo
        constraints = [
            models.UniqueConstraint(fields=['grupo', 'cpf'], name='unique_cpf_por_grupo'),
            models.UniqueConstraint(fields=['grupo', 'cartao_sus'], name='unique_sus_por_grupo'),
        ]

    def __str__(self): # Método para retornar uma representação em string do idoso
        return self.nome_completo # Retorna o nome completo do idoso

# 4. Modelo para Contato de Parente 
class ContatoParente(models.Model):
    
    # Chave estrangeira para o Idoso, associando o contato a um idoso específico
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name='contatos')
    
    # Classe interna para definir as opções de parentesco
    class ParentescoChoices(models.TextChoices):
        FILHO_A = 'FI', 'Filho(a)'
        NETO_A = 'NE', 'Neto(a)'
        IRMAO_A = 'IR', 'Irmão(ã)'
        PAI_MAE = 'PA', 'Pai/Mãe'
        AVO_A = 'AV', 'Avô/Avó'
        OUTRO = 'OU', 'Outro'

    nome = models.CharField(verbose_name="Nome do Parente", max_length=255) # Campo para o nome do parente
    parentesco = models.CharField(verbose_name="Parentesco", max_length=2, choices=ParentescoChoices.choices) # Campo para o grau de parentesco
    telefone = models.CharField(verbose_name="Telefone", max_length=20, blank=True) # Campo para o telefone do parente, opcional
    email = models.EmailField(verbose_name="E-mail", blank=True) # Campo para o e-mail do parente, opcional

    class Meta:
        verbose_name = "Contato de Parente" # Nome singular do modelo no admin
        verbose_name_plural = "Contatos de Parentes" # Nome plural do modelo no admin

    def __str__(self): # Método para retornar uma representação em string do contato
        return f"{self.nome} ({self.get_parentesco_display()}) - Contato de {self.idoso.nome_completo}"

# 5. Modelo para Medicamento
class Medicamento(models.Model):
   
    # Classe interna para definir as opções de forma farmacêutica
    class OpcoesFormaFarmaceutica(models.TextChoices):
        COMPRIMIDO = 'COMP', 'Comprimido'
        CAPSULA = 'CAP', 'Cápsula'
        LIQUIDO_ML = 'LIQ_ML', 'Líquido (ml)'
        CREME_G = 'CREME_G', 'Creme (g)'
        GOTA = 'GOTA', 'Gota'
        OUTRO = 'OUT', 'Outro'

    # Classe interna para definir as opções de unidade de concentração
    class OpcoesConcentracaoUnidade(models.TextChoices):
        MICROGRAMA_POR_GRAMA = 'mcg/g', 'mcg/g'
        MILIGRAMA_POR_GRAMA = 'mg/g', 'mg/g'
        MG_POR_ML = 'mg/ml', 'mg/ml'
        UNIDADE = 'UN', 'Unidade'
        OUTRO = 'OUT', 'Outro'

    # Chave estrangeira para o Grupo, indicando a qual grupo este medicamento pertence
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='medicamentos')
    
    # Campo para o nome comercial do medicamento
    nome_marca = models.CharField(
        verbose_name="Nome", 
        max_length=200, 
        unique=True,
        help_text="Nome comercial do medicamento. Se for genérico, pode repetir o princípio ativo."
    )
    # Campo para o princípio ativo (ex: Paracetamol, Cloridrato de Paroxetina)
    principio_ativo = models.CharField(
        verbose_name="Princípio Ativo", 
        blank=True,
        max_length=200
    )
    # Caixa de seleção Sim/Não para indicar se o medicamento é genérico
    generico = models.BooleanField(
        verbose_name="É Genérico?", 
        default=False
    )
    # Campo de texto para o laboratório/fabricante
    fabricante = models.CharField(
        verbose_name="Fabricante/Laboratório", 
        max_length=100, 
        blank=True
    )
    # Campo para o valor da concentração do medicamento
    concentracao_valor = models.DecimalField(
        verbose_name="Concentração (Valor)",
        max_digits=10, 
        decimal_places=2,
        null=True, blank=True
    )
    # Caixa de seleção para a unidade da concentração
    concentracao_unidade = models.CharField(
        verbose_name="Unidade de Concentração",
        max_length=5,
        choices=OpcoesConcentracaoUnidade.choices,
        null=True, blank=True
    )
    # Caixa de seleção para a forma do medicamento
    forma_farmaceutica = models.CharField(
        verbose_name="Forma Farmacêutica",
        max_length=10,
        choices=OpcoesFormaFarmaceutica.choices
    )
    # Campo para a quantidade em estoque
    quantidade_estoque = models.PositiveIntegerField(
        verbose_name="Quantidade em Estoque (Embalagens)", 
        default=0, 
        help_text="Número de caixas/frascos em estoque."
    )
    
    class Meta:
        verbose_name = "Medicamento" # Nome singular do modelo no admin
        verbose_name_plural = "Medicamentos" # Nome plural do modelo no admin
        
        # Restrição para garantir que a combinação de nome, princípio ativo e concentração seja única por grupo
        constraints = [
            models.UniqueConstraint(
                fields=['grupo', 'nome_marca', 'principio_ativo', 'concentracao_valor', 'concentracao_unidade'], 
                name='unique_medicamento_no_grupo'
            )
        ]

    def __str__(self): # Método para retornar uma representação em string do medicamento
        concentracao = ""
        if self.concentracao_valor and self.concentracao_unidade:
            # Formata o valor da concentração para não exibir casas decimais se for um número inteiro
            valor_str = int(self.concentracao_valor) if self.concentracao_valor.to_integral_value() == self.concentracao_valor else self.concentracao_valor
            concentracao = f" {valor_str}{self.get_concentracao_unidade_display()}"
        
        return f"{self.nome_marca} ({self.principio_ativo}){concentracao}"
    
    
# 6. Modelo para Prescricao de Medicamentos
class Prescricao(models.Model):
    # Classe interna para definir as opções de frequência da prescrição
    class FrequenciaChoices(models.TextChoices):
        DIARIA = 'DI', 'Diária'
        SEMANAL = 'SE', 'Semanal'
        MENSAL = 'ME', 'Mensal'
        EVENTUAL = 'EV', 'Eventual'
    # Campo para a frequência da administração do medicamento
    frequencia = models.CharField(
        max_length=2, 
        choices=FrequenciaChoices.choices, 
        default=FrequenciaChoices.DIARIA,
        verbose_name="Frequência da Dose"
    )
    # Campos booleanos para especificar os dias da semana para administração (se aplicável)
    dia_domingo = models.BooleanField(default=True, verbose_name="Domingo")
    dia_segunda = models.BooleanField(default=True, verbose_name="Segunda-feira")
    dia_terca = models.BooleanField(default=True, verbose_name="Terça-feira")
    dia_quarta = models.BooleanField(default=True, verbose_name="Quarta-feira")
    dia_quinta = models.BooleanField(default=True, verbose_name="Quinta-feira")
    dia_sexta = models.BooleanField(default=True, verbose_name="Sexta-feira")
    dia_sabado = models.BooleanField(default=True, verbose_name="Sábado")
    # Chave estrangeira para o Idoso a quem a prescrição se destina
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name="prescricoes")
    # Chave estrangeira para o Medicamento prescrito. PROTECT evita que um medicamento seja deletado se houver prescrições ativas para ele
    medicamento = models.ForeignKey(Medicamento, on_delete=models.PROTECT)
    # Campo para o horário previsto da administração da dose
    horario_previsto = models.TimeField(verbose_name="Horário da Dose")
    # Campo para a dosagem (ex: "1 comprimido", "5ml")
    dosagem = models.CharField(max_length=100, help_text="Ex: 1 comprimido, 5ml, 2 gotas")
    # Campo de texto para instruções adicionais
    instrucoes = models.TextField(blank=True, help_text="Ex: Administrar com alimentos.")
    # Campo booleano para ativar ou desativar a prescrição
    ativo = models.BooleanField(default=True, help_text="Desmarque para suspender esta prescrição.")

    class Meta:
        verbose_name = "Prescrição" # Nome singular do modelo no admin
        verbose_name_plural = "Prescrições" # Nome plural do modelo no admin
        ordering = ['horario_previsto'] # Ordena as prescrições por horário previsto por padrão

    def __str__(self): # Método para retornar uma representação em string da prescrição
        return f"{self.medicamento.nome_marca} para {self.idoso.nome_completo} às {self.horario_previsto.strftime('%H:%M')}"

# 7. Modelo para Registro de administração de Medicamento   
class LogAdministracao(models.Model):
    # Classe interna para definir o status da administração da dose
    class StatusDose(models.TextChoices):
        ADMINISTRADO = 'OK', 'Administrado'
        RECUSADO = 'REC', 'Recusado pelo paciente'
        PULADO = 'PUL', 'Pulado/Esquecido'

    # Chave estrangeira para a Prescrição correspondente
    prescricao = models.ForeignKey(Prescricao, on_delete=models.CASCADE, related_name="logs_de_administracao")
    # Campo para registrar a data e hora exatas da administração
    data_hora_administracao = models.DateTimeField(default = timezone.now, verbose_name="Data e Hora da Administração")
    # Campo para o status da dose
    status = models.CharField(max_length=3, choices=StatusDose.choices, default=StatusDose.ADMINISTRADO)
    # Chave estrangeira para o usuário que registrou a administração. SET_NULL define o campo como nulo se o usuário for deletado
    usuario_responsavel = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    # Campo de texto para observações adicionais
    observacoes = models.TextField(blank=True)

    def __str__(self): # Método para retornar uma representação em string do log
        return f"Dose de {self.prescricao.medicamento.nome_marca} para {self.prescricao.idoso.nome_completo} em {self.data_hora_administracao.strftime('%d/%m/%y %H:%M')}"
    
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def criar_perfil_usuario_apos_criar_usuario(sender, instance, created, **kwargs):
    """
    Cria um PerfilUsuario automaticamente sempre que um novo usuário (Usuario) é criado.
    Este é um 'signal receiver' que escuta o sinal 'post_save' do modelo de usuário.
    """
    if created: # 'created' é um booleano que indica se a instância foi criada ou apenas atualizada
        PerfilUsuario.objects.create(user=instance)


@receiver(post_save, sender=Grupo)
def criar_grupo(sender, instance, created, **kwargs):
    """
    Função de exemplo para executar uma ação após a criação de um Grupo.
    Este é um 'signal receiver' que escuta o sinal 'post_save' do modelo Grupo.
    """
    if created: # Executa apenas na criação do objeto
        print(f"Grupo criado: {instance.nome}")