import os
import json
import threading
from flask import Flask, jsonify, request, render_template_string
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURAÇÃO DO SITE (FLASK) ---
app = Flask(__name__)

def carregar_dados():
    try:
        with open("usuarios_registrados.json", "r", encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
            return dados if isinstance(dados, list) else [dados]
    except:
        return []

@app.route('/')
def home():
    dados = carregar_dados()
    # Página visual simples para você ver os logins salvos no navegador
    html = """
    <html>
        <head><title>Painel de Monitoramento</title></head>
        <body style="font-family: Arial; margin: 40px; background: #f4f4f9;">
            <h1>📋 Painel de Monitoramento</h1>
            <p>Registros salvos no JSON atualmente:</p>
            <pre style="background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
{{ dados | tojson(indent=2) }}
            </pre>
        </body>
    </html>
    """
    return render_template_string(html, dados=dados)

# --- CONFIGURAÇÃO DO BOT DO DISCORD ---
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"Bot conectado e online como: {bot.user.name}")

# --- INICIALIZAÇÃO SIMULTÂNEA ---
def rodar_bot():
    token = os.getenv("DISCORD_TOKEN")
    if token:
        bot.run(token)
    else:
        print("Erro: DISCORD_TOKEN não configurado nas variáveis.")

if __name__ == "__main__":
    # 1. Inicia o Bot do Discord em uma Thread separada (segundo plano)
    t = threading.Thread(target=rodar_bot)
    t.start()
    
    # 2. Inicia o Servidor Web na porta exigida pelo Railway
    porta = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=porta)
