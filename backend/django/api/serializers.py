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

# Obtém o modelo de usuário ativo do Django.
Usuario = get_user_model()

# Serializer para o modelo ContatoParente.
class ContatoParenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContatoParente
        # Exclui o campo 'idoso' para evitar redundância quando aninhado em IdosoDetailSerializer.
        exclude = ('idoso',)

# Serializer para o modelo Medicamento.
class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        # Inclui todos os campos do modelo.
        fields = '__all__'
        # O campo 'grupo' é somente leitura, pois é definido automaticamente com base no usuário.
        read_only_fields = ('grupo',)

# Serializer para o modelo LogAdministracao.
class LogAdministracaoSerializer(serializers.ModelSerializer):
    # Exibe o nome do usuário responsável em vez do ID.
    usuario_responsavel = serializers.StringRelatedField()
    class Meta:
        model = LogAdministracao
        # Inclui todos os campos do modelo.
        fields = '__all__'

# Serializer para o modelo Prescricao.
class PrescricaoSerializer(serializers.ModelSerializer):
    # Para leitura, exibe os detalhes completos do medicamento.
    medicamento = MedicamentoSerializer(read_only=True)
    # Para leitura, exibe o nome do idoso.
    idoso = serializers.StringRelatedField(read_only=True)
    
    # Para escrita, permite associar um idoso pelo seu ID.
    idoso_id = serializers.PrimaryKeyRelatedField(
        queryset=Idoso.objects.all(), source='idoso', write_only=True
    )
    # Para escrita, permite associar um medicamento pelo seu ID.
    medicamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicamento.objects.all(), source='medicamento', write_only=True
    )

    class Meta:
        model = Prescricao
        # Define os campos a serem incluídos na serialização.
        fields = [
            'id', 'idoso', 'idoso_id', 'medicamento', 'medicamento_id',
            'horario_previsto', 'dosagem', 'instrucoes', 'ativo',
            'frequencia',
            'dia_domingo', 'dia_segunda', 'dia_terca', 'dia_quarta',
            'dia_quinta', 'dia_sexta', 'dia_sabado'
        ]


# Serializer para listar múltiplos idosos (visão de lista).
class IdosoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idoso
        # Inclui todos os campos do modelo.
        fields = '__all__'


# Serializer para a visão de detalhes de um único idoso.
class IdosoDetailSerializer(serializers.ModelSerializer):
    # Aninha o serializer de contatos para exibir os contatos do idoso.
    contatos = ContatoParenteSerializer(many=True, read_only=True)
    # Aninha o serializer de prescrições para exibir a agenda de medicamentos.
    prescricoes = PrescricaoSerializer(many=True, read_only=True)

    class Meta:
        model = Idoso
        # Exclui o campo 'grupo' para não expô-lo diretamente na API de idosos.
        exclude = ('grupo',)

# Serializer básico para o modelo de Usuário.
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        # Define os campos a serem exibidos.
        fields = ['id', 'email', 'nome_completo']

# Serializer para o perfil do usuário.
class PerfilUsuarioSerializer(serializers.ModelSerializer):
    # Aninha o serializer de usuário para exibir detalhes do usuário associado.
    user = UsuarioSerializer(read_only=True)
    # Exibe os nomes dos grupos aos quais o usuário pertence.
    grupos = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = PerfilUsuario
        # Define os campos a serem incluídos.
        fields = ['user', 'permissao', 'responsaveis', 'grupos']

# Serializer para o registro de novos usuários.
class UserRegistrationSerializer(serializers.ModelSerializer):
    # Campo de senha, apenas para escrita e com input do tipo 'password'.
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    class Meta:
        model = Usuario
        # Campos necessários para o registro.
        fields = ['email', 'nome_completo', 'password']

    def create(self, validated_data):
        # Usa o método create_user para garantir que a senha seja hasheada corretamente.
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            nome_completo=validated_data['nome_completo'],
            password=validated_data['password']
        )
        return user

# Serializer para visualização e atualização do perfil do próprio usuário.
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nome_completo']
        # O ID do usuário é somente leitura.
        read_only_fields = ('id',)


# Serializer para a funcionalidade de alteração de senha.
class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para a funcionalidade de alteração de senha.
    """
    # Campos para a senha antiga e a nova senha (com confirmação).
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
        Verifica se as duas novas senhas fornecidas são idênticas e se a nova senha é válida.
        """
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': "A confirmação da nova senha não corresponde."})

        # Valida a complexidade da nova senha usando os validadores do Django.
        try:
            validate_password(data['new_password1'], self.context['request'].user)
        except ValidationError as e:
            raise serializers.ValidationError({'new_password1': list(e.messages)})

        return data

# Serializer para exibir os detalhes de um Grupo.
class GrupoSerializer(serializers.ModelSerializer):
    # Aninha o serializer de perfil para mostrar os membros do grupo.
    membros = PerfilUsuarioSerializer(many=True, read_only=True)
    # Aninha o serializer de usuário para mostrar os detalhes do admin.
    admin = UsuarioSerializer(read_only=True)
    class Meta:
        model = Grupo
        # Define os campos a serem incluídos na serialização.
        fields = [
            'id', 'nome', 'admin', 'membros', 'endereco', 'telefone', 
            'cidade', 'estado', 'cep', 'nome_responsavel'
        ]

# Serializer para a criação de um novo Grupo.
class GrupoCreateSerializer(serializers.ModelSerializer):
    # Campo de senha, apenas para escrita.
    senha = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = Grupo
        # Campos necessários para a criação do grupo.
        fields = [
            'nome', 'senha', 'endereco', 'telefone', 
            'cidade', 'estado', 'cep', 'nome_responsavel'
        ]


    def create(self, validated_data):
            # Remove a senha crua dos dados validados.
            senha_crua = validated_data.pop('senha')
            # Cria o hash da senha e o adiciona aos dados.
            validated_data['senha_hash'] = make_password(senha_crua)
            # Cria o objeto Grupo com a senha hasheada.
            grupo = Grupo.objects.create(**validated_data)
            return grupo