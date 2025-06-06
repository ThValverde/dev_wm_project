# -*- coding: utf-8 -*-
from django.db import models
from django.contrib.auth.models import User

# criar as coisas que vou armazenar no meu banco de dados, como usuários, produtos, etc. são os models
# Create your models here.

class Idoso(models.Model):
    
    class OpcoesGenero(models.TextChoices):
        MASCULINO = 'M', 'Masculino'
        FEMININO = 'F', 'Feminino'
        OUTRO = 'O', 'Outro / Não informar'
    
    nome_completo = models.CharField(max_length=255)
    #foto = models.ImageField(upload_to='fotos_idosos/', null=True, blank=True) # null=True e blank=True permitem que o campo seja opcional
    data_nascimento = models.DateField()
    peso = models.DecimalField(max_digits=5, decimal_places=2, help_text="Peso em kg")
    genero = models.CharField(
        verbose_name="Gênero",
        max_length=1,
        choices=OpcoesGenero.choices,
    )
    
    cpf = models.CharField(
        verbose_name="CPF",
        max_length=11,    
        unique=True,          # Garante que não haverá CPFs duplicados
       
    )
    rg = models.CharField(
        verbose_name="RG",
        max_length=9,
        unique=True, # Garante que não haverá RGs duplicados
        null=True, blank=True # Torna o campo opcional
    )
    
    cartao_sus = models.CharField(
        verbose_name="Cartão Nacional de Saúde (CNS)",
            unique=True, # Garante que não haverá números de cartão SUS duplicados
        max_length=20
        )
    
    
    class OpcoesPlanoSaude(models.TextChoices):
        BRADESCO = 'BRA', 'Bradesco Saúde'
        UNIMED = 'UNI', 'Unimed'
        SULAMERICA = 'SUL', 'SulAmérica'
        HAPVIDA = 'HAP', 'Hapvida'
        OUTRO = 'OUT', 'Outro'

    possui_plano_saude = models.BooleanField(
        verbose_name="Possui plano de saúde?",
        default=False
    )
    plano_saude = models.CharField(
        verbose_name="Plano de Saúde",
        max_length=3,
        choices=OpcoesPlanoSaude.choices,
        null=True, blank=True # Opcional, caso não tenha plano
    )
    plano_saude_outro = models.CharField(
        verbose_name="Qual outro plano?",
        max_length=100,
        null=True, blank=True # Opcional, só preenche se o de cima for "Outro"
    )
    numero_carteirinha_plano = models.CharField(
        verbose_name="Número da Carteirinha (Plano de Saúde)",
        max_length=50,
        unique=True, # Garante que não haverá números de carteirinha duplicados
        null=True, blank=True # Opcional, caso não tenha plano
    )
    
    '''   numero_carteirinha_sus = models.CharField(
        verbose_name="Número da Carteirinha - SUS",
        max_length=50
    )'''
   
    doencas = models.TextField(verbose_name="Doenças",blank=True, help_text="Doenças pré-existentes")
    condicoes = models.TextField(verbose_name="Condições",blank=True, help_text="Condições especiais ou alergias")
    
    
    
    def __str__(self):
        return self.nome_completo
    
class ContatoParente(models.Model):
    class ParentescoChoices(models.TextChoices):
        FILHO_A = 'FI', 'Filho(a)'
        NETO_A = 'NE', 'Neto(a)'
        CONJUGE = 'CO', 'Cônjuge'
        SOBRINHO_A = 'SO', 'Sobrinho(a)'
        OUTRO = 'OU', 'Outro'

    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name='contatos')
    nome = models.CharField(verbose_name="Nome do Parente", max_length=255)
    parentesco = models.CharField(verbose_name="Parentesco", max_length=2, choices=ParentescoChoices.choices)
    telefone = models.CharField(verbose_name="Telefone", max_length=20, blank=True)
    email = models.EmailField(verbose_name="E-mail", blank=True)

    class Meta:
        verbose_name = "Contato de Parente"
        verbose_name_plural = "Contatos de Parentes"

    def __str__(self):
        return f"{self.nome} ({self.get_parentesco_display()}) - Contato de {self.idoso.nome_completo}"


class Medicamento(models.Model):
    
    class OpcoesDosagemUnidade(models.TextChoices):
        MGG = 'mg/g', 'mg/g'
        MCGG = 'mcg/g', 'mcg/g'
        MGML = 'mg/ml', 'mg/ml'

    class OpcoesFormaFarmaceutica(models.TextChoices):
        COMPRIMIDO = 'COMP', 'Comprimido'
        CAPSULA = 'CAP', 'Cápsula'
        LIQUIDO_ML = 'LIQ_ML', 'Líquido (ml)'
        CREME_G = 'CREME_G', 'Creme (g)'
        OUTRO = 'OUT', 'Outro'
    
    nome = models.CharField(max_length=200, unique=True)
    quantidade_estoque = models.PositiveIntegerField(
        verbose_name="Quantidade em Estoque (Embalagens)",
        default=0,
        help_text="Número de caixas/frascos em estoque."
    )
    preco = models.DecimalField(
        verbose_name="Preço por Embalagem",
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    forma_farmaceutica = models.CharField(
        verbose_name="Forma Farmacêutica",
        max_length=10,
        choices=OpcoesFormaFarmaceutica.choices,
        null=True, blank=True
    )

    dosagem_valor = models.DecimalField(
        verbose_name="Valor da Dosagem",
        max_digits=10, decimal_places=0, null=True, blank=True,
        help_text="Ex: 50mg/g, adicionar 500 aqui e selecionar 'mg/g' abaixo."
    )
    dosagem_unidade = models.CharField(
        verbose_name="Unidade da Dosagem",
        max_length=5,
        choices=OpcoesDosagemUnidade.choices,
        null=True, blank=True
    )

    
    quantidade_por_embalagem = models.DecimalField(
        verbose_name="Quantidade por Embalagem",
        max_digits=10, decimal_places=0, null=True, blank=True,
        help_text="Nº de comprimidos/cápsulas por caixa ou volume total em ml. Ex: 20 comprimidos ou 500 ml."
    )
    def __str__(self):
        return f"{self.nome} ({self.dosagem_valor}{self.dosagem_unidade})"

class AdministracaoMedicamento(models.Model):
    idoso = models.ForeignKey(Idoso, on_delete=models.CASCADE, related_name="medicacoes")
    '''on_delete=models.CASCADE diz que se um idoso for deletado do banco de dados, 
    será deletado em cascata todos os registros de administração de medicamentos associados a ele'''
    medicamento = models.ForeignKey(Medicamento, on_delete=models.PROTECT)
    horario_previsto = models.DateTimeField()
    foi_administrado = models.BooleanField(default=False)
    nao_tomou_motivo = models.CharField(max_length=255, blank=True, null=True, help_text="Preencher se o idoso não tomou o medicamento (NT)")
    enfermeiro_responsavel = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    data_hora_administracao = models.DateTimeField(null=True, blank=True, help_text="Horário exato em que foi administrado")

    class Meta:
        verbose_name = "Administração de Medicamento"
        verbose_name_plural = "Administrações de Medicamentos"
        ordering = ['horario_previsto']

    def __str__(self):
        status = "Administrado" if self.foi_administrado else "Pendente"
        return f"{self.medicamento.nome} para {self.idoso.nome_completo} em {self.horario_previsto.strftime('%d/%m/%Y %H:%M')} ({status})"