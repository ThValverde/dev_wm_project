from django.contrib import admin
from .models import Idoso, Medicamento, AdministracaoMedicamento, ContatoParente


# Register your models here.

class ContatoParenteInline(admin.TabularInline):
    model = ContatoParente
    extra = 1  # Mostra 1 formulário extra para adicionar um novo contato por padrão

# Crie uma classe de Admin para o Idoso
class IdosoAdmin(admin.ModelAdmin):
    inlines = [ContatoParenteInline] # Adicione o inline aqui
    list_display = ('nome_completo', 'data_nascimento', 'genero') # Bônus: melhora a lista de idosos
    search_fields = ['nome_completo'] # Bônus: adiciona uma barra de busca

# Des-registre o modelo Idoso se ele já estiver registrado de forma simples
# e o re-registre com a classe IdosoAdmin customizada.
# Se você tiver 'admin.site.register(Idoso)', apague essa linha.

admin.site.register(Idoso, IdosoAdmin)
admin.site.register(Medicamento) # Os outros podem continuar registrados de forma simples
admin.site.register(AdministracaoMedicamento)
# Não precisamos registrar o ContatoParente aqui, pois ele será gerenciado pelo IdosoAdmin

