from django.contrib import admin
from .models import Idoso, Medicamento, ContatoParente, Prescricao, LogAdministracao


class ContatoParenteInline(admin.TabularInline):
    model = ContatoParente
    extra = 1  # Mostra 1 formulário extra para adicionar um novo contato por padrão

# Crie uma classe de Admin para o Idoso
class IdosoAdmin(admin.ModelAdmin):
    inlines = [ContatoParenteInline]
    list_display = ('nome_completo', 'data_nascimento', 'genero') 
    search_fields = ['nome_completo']

admin.site.register(Idoso, IdosoAdmin)
admin.site.register(Medicamento)
admin.site.register(Prescricao)
admin.site.register(LogAdministracao)

