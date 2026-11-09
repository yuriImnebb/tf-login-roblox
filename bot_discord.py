import os
import json
import discord
from discord.ext import commands
from dotenv import load_dotenv

# Carrega as variáveis contidas no arquivo .env
load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
# Converte o ID do canal para inteiro, pois o Discord processa IDs como números
try:
    CANAL_LOG_ID = int(os.getenv("LOG_CHANNEL_ID"))
except (TypeError, ValueError):
    CANAL_LOG_ID = None
    print("Aviso: ID do canal de logs não configurado corretamente no arquivo .env")

# Configura as permissões do bot
intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

def carregar_dados():
    try:
        with open("usuarios_registrados.json", "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
            if isinstance(dados, list):
                return dados
            return [dados]
    except FileNotFoundError:
        print("Erro: 'usuarios_registrados.json' não encontrado.")
        return []
    except json.JSONDecodeError:
        print("Erro: JSON mal formatado.")
        return []

@bot.event
async def on_ready():
    print(f"Bot conectado com sucesso como: {bot.user.name}")
    
    # Valida se o canal foi configurado
    if CANAL_LOG_ID:
        canal = bot.get_channel(CANAL_LOG_ID)
        if canal:
            print(f"Canal de logs identificado: #{canal.name}")
            
            # Executa a leitura e envia o log estruturado para o canal
            usuarios = carregar_dados()
            if usuarios:
                await canal.send(f"📅 **[LOG DE INICIALIZAÇÃO]** Verificados {len(usuarios)} registros no banco de dados local.")
                
                for item in usuarios:
                    username = item.get("username", "Não informado")
                    timestamp = item.get("timestamp", "Não informado")
                    
                    mensagem = (
                        f"👤 **Usuário:** `{username}`\n"
                        f"📅 **Data de Registro:** `{timestamp}`\n"
                        f"────────────────"
                    )
                    await canal.send(mensagem)
            else:
                await canal.send("⚠️ **[LOG]** Arquivo de usuários lido, mas nenhum registro foi encontrado.")
        else:
            print("Erro: Não foi possível encontrar o canal de logs. Verifique se o bot está no servidor correto.")
    else:
        print("Erro: LOG_CHANNEL_ID não está configurado no arquivo .env")

if __name__ == "__main__":
    if TOKEN:
        bot.run(TOKEN)
    else:
        print("Erro crítico: DISCORD_TOKEN não encontrado no arquivo .env")
