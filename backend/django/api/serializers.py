# api/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from .models import (
    Grupo,
    PerfilUsuario,
    Idoso,
    ContatoParente,
    Medicamento,
    AdministracaoMedicamento
)

# Obtém o modelo de usuário customizado que você está usando (seja o padrão ou um personalizado)
Usuario = get_user_model()


# --- Serializers de Suporte (modelos mais simples ou aninhados) ---

class ContatoParenteSerializer(serializers.ModelSerializer):
    """ Serializer para visualizar e criar contatos de parentes. """
    class Meta:
        model = ContatoParente
        # Excluímos 'idoso' pois este serializer será usado aninhado dentro de IdosoSerializer
        exclude = ('idoso',)


class MedicamentoSerializer(serializers.ModelSerializer):
    """ Serializer para gerenciar os medicamentos de um grupo. """
    class Meta:
        model = Medicamento
        # Excluímos 'grupo' pois o contexto do grupo virá da URL (ex: /api/grupos/1/medicamentos/)
        exclude = ('grupo',)


class AdministracaoMedicamentoSerializer(serializers.ModelSerializer):
    """ Serializer para visualizar as administrações de medicamentos. """
    # Usamos StringRelatedField para mostrar o nome do medicamento e do enfermeiro,
    # em vez de apenas seus IDs. Fica mais legível no frontend.
    medicamento = serializers.StringRelatedField(read_only=True)
    enfermeiro_responsavel = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = AdministracaoMedicamento
        fields = '__all__'


# --- Serializers Principais (com aninhamento) ---

class IdosoListSerializer(serializers.ModelSerializer):
    """
    Serializer SIMPLIFICADO para ser usado na listagem principal de idosos.
    Mostra apenas as informações essenciais.
    """
    class Meta:
        model = Idoso
        fields = ['id', 'nome_completo', 'data_nascimento']


class IdosoDetailSerializer(serializers.ModelSerializer):
    """
    Serializer COMPLETO para a visualização de detalhes de UM idoso.
    Inclui informações aninhadas de contatos e medicações.
    """
    contatos = ContatoParenteSerializer(many=True, read_only=True)
    medicacoes = AdministracaoMedicamentoSerializer(many=True, read_only=True)

    class Meta:
        model = Idoso
        # Excluímos 'grupo' pois o contexto virá da URL.
        exclude = ('grupo',)


# --- Serializers de Usuário e Autenticação ---

class UsuarioSerializer(serializers.ModelSerializer):
    """ Serializer para o modelo de usuário. Usado para mostrar dados do usuário. """
    class Meta:
        model = Usuario
        # Campos que são seguros de se expor na API
        fields = ['id', 'email', 'nome_completo']


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    """ Serializer para o perfil, mostrando o usuário aninhado. """
    user = UsuarioSerializer(read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = ['user', 'permissao']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """ Serializer específico para o CADASTRO de novos usuários. """
    # Garantimos que a senha seja exigida no cadastro, mas nunca retornada na resposta.
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['email', 'nome_completo', 'password']

    def create(self, validated_data):
        # Usamos a função create_user do nosso manager para garantir que a senha
        # seja corretamente criptografada (hashed).
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            nome_completo=validated_data['nome_completo'],
            password=validated_data['password']
        )
        return user


# --- Serializer do Modelo Principal (Grupo) ---

class GrupoSerializer(serializers.ModelSerializer):
    """
    Serializer para a visualização de detalhes de um Grupo.
    Mostra o administrador e os membros do grupo de forma aninhada.
    """
    # Usamos o 'source' para acessar o related_name reverso do PerfilUsuario
    membros = PerfilUsuarioSerializer(many=True, read_only=True)
    admin = UsuarioSerializer(read_only=True)

    class Meta:
        model = Grupo
        # Excluímos o hash da senha da visualização por segurança.
        fields = ['id', 'nome', 'admin', 'membros']


class GrupoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer específico para a CRIAÇÃO de um novo Grupo.
    """
    # Exigimos a senha na criação, mas ela não será lida ou exibida.
    senha = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Grupo
        fields = ['nome', 'senha']

    def create(self, validated_data):
        # Removemos a senha "crua" dos dados antes de criar o grupo
        senha_crua = validated_data.pop('senha')
        
        # Criamos o hash da senha
        validated_data['senha_hash'] = make_password(senha_crua)
        
        # Pegamos o usuário que está fazendo a requisição para definir como admin
        # Isso será feito na View, aqui apenas preparamos os dados.
        validated_data['admin'] = self.context['request'].user

        grupo = Grupo.objects.create(**validated_data)
        return grupo