const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'usuarios_registrados.json');

// Middleware para processar requisições em formato JSON
app.use(express.json());

// Serve os arquivos estáticos (HTML, CSS, Imagens) da pasta atual
app.use(express.static(__dirname));

// Rota POST que recebe os dados do formulário e salva no arquivo JSON
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

// Inicializa o servidor na porta configurada
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso em: http://localhost:${PORT}`);
});
