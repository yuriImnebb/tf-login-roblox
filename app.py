import os
import json
import asyncio
from flask import Flask, jsonify, render_template_string
import discord
from discord.ext import commands
from dotenv import load_dotenv
import threading

load_dotenv()

# --- CONFIGURAÇÃO DO SITE (FLASK) ---
app = Flask(__name__)

def carregar_dados():
    try:
        with open("usuarios_registrados.json", "r", encoding="utf-8") as arquivo:
            return json.load(arquivo)
    except:
        return []

@app.route('/')
def home():
    dados = carregar_dados()
    # Uma página HTML simples e visual para você ver no navegador
    html = """
    <html>
        <head><title>Painel de Usuários</title></head>
        <body style="font-family: Arial; margin: 40px; background: #f4f4f9;">
            <h1>📋 Painel de Monitoramento</h1>
            <p>Registros salvos no JSON:</p>
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
    print(f"Bot conectado como: {bot.user.name}")

# --- INICIALIZAÇÃO MULTI-THREADING ---
def rodar_bot():
    token = os.getenv("DISCORD_TOKEN")
    if token:
        bot.run(token)

if __name__ == "__main__":
    # 1. Roda o bot do Discord em segundo plano (Thread separada)
    t = threading.Thread(target=rodar_bot)
    t.start()
    
    # 2. Roda o site Flask na porta que o Railway fornecer
    porta = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=porta)
