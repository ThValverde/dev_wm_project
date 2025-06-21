from django.contrib import admin
from .models import Grupo, Idoso, Medicamento, ContatoParente, Prescricao, LogAdministracao


class ContatoParenteInline(admin.TabularInline):
    model = ContatoParente
    extra = 1

# Classe de Admin para o Idoso
class IdosoAdmin(admin.ModelAdmin):
    inlines = [ContatoParenteInline]
    list_display = ('nome_completo', 'data_nascimento', 'genero', 'grupo') 
    search_fields = ['nome_completo']
    list_filter = ('grupo',)

# Classe de Admin para o Grupo (NOVO)
class GrupoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cidade', 'admin')
    search_fields = ('nome', 'cidade')
    readonly_fields = ('codigo_acesso', 'data_criacao', 'data_atualizacao')


admin.site.register(Grupo, GrupoAdmin) # NOVO
admin.site.register(Idoso, IdosoAdmin)
admin.site.register(Medicamento)
admin.site.register(Prescricao)
admin.site.register(LogAdministracao)