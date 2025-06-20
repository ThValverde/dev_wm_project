# api/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import (
    Grupo,
    PerfilUsuario,
    Idoso,
    ContatoParente,
    Medicamento,
    Prescricao, 
    LogAdministracao
)

Usuario = get_user_model()

class ContatoParenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContatoParente
        exclude = ('idoso',)

class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        fields = '__all__'
        read_only_fields = ('grupo',)

class LogAdministracaoSerializer(serializers.ModelSerializer):
    usuario_responsavel = serializers.StringRelatedField()
    class Meta:
        model = LogAdministracao
        fields = '__all__'

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



class IdosoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idoso
        fields = '__all__'


class IdosoDetailSerializer(serializers.ModelSerializer):
    contatos = ContatoParenteSerializer(many=True, read_only=True)
    # Isso mostra a agenda de medicamentos do idoso
    prescricoes = PrescricaoSerializer(many=True, read_only=True)

    class Meta:
        model = Idoso
        exclude = ('grupo',)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome_completo']

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    user = UsuarioSerializer(read_only=True)
    class Meta:
        model = PerfilUsuario
        fields = ['user', 'permissao', 'responsaveis']

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

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome_completo']
        read_only_fields = ('id',)



class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para a funcionalidade de alteração de senha.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password1 = serializers.CharField(required=True, write_only=True)
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        """
        Verifica se a senha antiga fornecida pelo usuário está correta.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Sua senha antiga foi digitada incorretamente. Por favor, tente novamente.")
        return value

    def validate(self, data):
        """
        Verifica se as duas novas senhas fornecidas são idênticas.
        """
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': "A confirmação da nova senha não corresponde."})

        # Valida a complexidade da nova senha usando os validadores do Django
        try:
            validate_password(data['new_password1'], self.context['request'].user)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password1': list(e.messages)})

        return data

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