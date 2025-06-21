# admin.py - Este arquivo é responsável por registrar os modelos no Django Admin
from django.contrib import admin    # Importando o módulo admin do Django
from .models import Grupo, Idoso, Medicamento, ContatoParente, Prescricao, LogAdministracao # Importando os modelos necessários


class ContatoParenteInline(admin.TabularInline):    # Classe para exibir os contatos parentes de forma inline
    model = ContatoParente  # Modelo relacionado
    extra = 1

# Classe de Admin para o Idoso
class IdosoAdmin(admin.ModelAdmin):     # Classe para gerenciar o modelo Idoso no admin
    inlines = [ContatoParenteInline]    # Incluindo os contatos parentes como inline
    list_display = ('nome_completo', 'data_nascimento', 'genero', 'grupo')  # Campos a serem exibidos na lista
    search_fields = ['nome_completo']   # Campos pesquisáveis
    list_filter = ('grupo',)    # Filtro por grupo

# Classe de Admin para o Grupo
class GrupoAdmin(admin.ModelAdmin):   # Classe para gerenciar o modelo Grupo no admin
    list_display = ('nome', 'cidade', 'admin')  # Campos a serem exibidos na lista
    search_fields = ('nome', 'cidade')  # Campos pesquisáveis
    readonly_fields = ('codigo_acesso', 'data_criacao', 'data_atualizacao') # Campos somente leitura


admin.site.register(Grupo, GrupoAdmin)  # Registrando o modelo Grupo com a classe de admin personalizada
admin.site.register(Idoso, IdosoAdmin)  # Registrando o modelo Idoso com a classe de admin personalizada
admin.site.register(Medicamento)        # Registrando o modelo Medicamento
admin.site.register(Prescricao)     # Registrando o modelo Prescricao
admin.site.register(LogAdministracao)       # Registrando o modelo LogAdministracao