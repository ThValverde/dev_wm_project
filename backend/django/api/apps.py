#apps.py - Este arquivo é responsável por configurar o aplicativo API no Django
from django.apps import AppConfig   # Importando o AppConfig do Django para configurar o aplicativo

class ApiConfig(AppConfig):   # Classe de configuração do aplicativo API
    default_auto_field = 'django.db.models.BigAutoField'    # Campo padrão para auto incremento
    name = 'api'    # Nome do aplicativo, que deve corresponder ao diretório onde está localizado
