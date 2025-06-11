# api/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

# CORREÇÃO 1: Importar os modelos com os nomes corretos
from .models import (
    Grupo,
    PerfilUsuario,
    Idoso,
    ContatoParente,
    Medicamento,
    Prescricao, 
    LogAdministracao,
    Notificacao
)

# Obtém o modelo de usuário customizado
Usuario = get_user_model()


# --- Serializers de Suporte ---

class ContatoParenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContatoParente
        exclude = ('idoso',)


class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        exclude = ('grupo',)


class LogAdministracaoSerializer(serializers.ModelSerializer):
    usuario_responsavel = serializers.StringRelatedField()
    class Meta:
        model = LogAdministracao
        fields = '__all__'

# Serializer para o modelo Prescricao que criamos
class PrescricaoSerializer(serializers.ModelSerializer):
    medicamento = MedicamentoSerializer(read_only=True)
    idoso = serializers.StringRelatedField(read_only=True)
    
    idoso_id = serializers.PrimaryKeyRelatedField(
        queryset=Idoso.objects.all(), source='idoso', write_only=True
    )
    medicamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicamento.objects.all(), source='medicamento', write_only=True
    )

    class Meta:
        model = Prescricao
        fields = [
            'id', 'idoso', 'idoso_id', 'medicamento', 'medicamento_id',
            'horario_previsto', 'dosagem', 'instrucoes', 'ativo'
        ]


# --- Serializers Principais ---

class IdosoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idoso
        fields = ['id', 'nome_completo', 'data_nascimento']


class IdosoDetailSerializer(serializers.ModelSerializer):
    contatos = ContatoParenteSerializer(many=True, read_only=True)
    # CORREÇÃO 2: Alterado para 'prescricoes' e usando o serializer correto.
    # Isso mostrará a "agenda de medicamentos" do idoso.
    prescricoes = PrescricaoSerializer(many=True, read_only=True)

    class Meta:
        model = Idoso
        exclude = ('grupo',)
        # Adicionamos 'prescricoes' ao fields para garantir que apareça se 'fields' for usado
        # Se você usa 'exclude', já está implícito. Mas é bom saber.


# --- Serializers de Usuário e Grupo ---

# (As classes UsuarioSerializer, PerfilUsuarioSerializer, UserRegistrationSerializer,
# GrupoSerializer e GrupoCreateSerializer podem continuar exatamente como estão)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome_completo']

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    user = UsuarioSerializer(read_only=True)
    class Meta:
        model = PerfilUsuario
        fields = ['user', 'permissao', 'responsaveis', 'device_token']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    class Meta:
        model = Usuario
        fields = ['email', 'nome_completo', 'password']

    def create(self, validated_data):
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            nome_completo=validated_data['nome_completo'],
            password=validated_data['password']
        )
        return user

class GrupoSerializer(serializers.ModelSerializer):
    membros = PerfilUsuarioSerializer(many=True, read_only=True)
    admin = UsuarioSerializer(read_only=True)
    class Meta:
        model = Grupo
        fields = ['id', 'nome', 'admin', 'membros']

class GrupoCreateSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = Grupo
        fields = ['nome', 'senha']

    def create(self, validated_data):
        senha_crua = validated_data.pop('senha')
        validated_data['senha_hash'] = make_password(senha_crua)
        grupo = Grupo.objects.create(**validated_data)
        return grupo

# NOVO SERIALIZER ADICIONADO
class NotificacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacao
        fields = ['id', 'titulo', 'corpo', 'data_criacao', 'lida']