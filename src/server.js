import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import { initDb } from './sql/initDb.js';
import { importRoutes } from './routes/importRoutes.js';
import { dataRoutes } from './routes/dataRoutes.js';
import { startScheduler } from './jobs/scheduler.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));

// Página inicial amigável
app.get('/', async (req, res) => {
  let banco = 'Não testado';

  try {
    banco = await testConnection();
  } catch (err) {
    banco = {
      erro: err.message
    };
  }

  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comprovei Translog</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f6f9;
      margin: 0;
      padding: 30px;
    }

    h1 {
      color: #003366;
    }

    .container {
      max-width: 1100px;
      margin: auto;
    }

    .status {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,.1);
    }

    .card h2 {
      margin-top: 0;
      color: #333;
    }

    .btn {
      display: inline-block;
      background: #0066cc;
      color: white;
      padding: 10px 16px;
      border-radius: 5px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      margin-top: 8px;
    }

    .btn:hover {
      background: #004c99;
    }

    input {
      padding: 8px;
      margin: 4px 0;
      width: 100%;
      box-sizing: border-box;
    }

    pre {
      background: #111;
      color: #0f0;
      padding: 15px;
      border-radius: 8px;
      overflow: auto;
      margin-top: 20px;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1>🚚 Comprovei - Translog</h1>

    <div class="status">
      <strong>Status do sistema:</strong> Online<br>
      <strong>Banco:</strong> ${JSON.stringify(banco)}
    </div>

    <div class="grid">

      <div class="card">
        <h2>Rotas WS601</h2>
        <p>Consulta as rotas importadas da Comprovei.</p>
        <a class="btn" href="/dados/rotas" target="_blank">Abrir Rotas</a>
      </div>

      <div class="card">
        <h2>Documentos WS613</h2>
        <p>Consulta os documentos importados da Comprovei.</p>
        <a class="btn" href="/dados/documentos" target="_blank">Abrir Documentos</a>
      </div>

      <div class="card">
        <h2>Histórico</h2>
        <p>Consulta o histórico das importações realizadas.</p>
        <a class="btn" href="/dados/historico" target="_blank">Abrir Histórico</a>
      </div>

      <div class="card">
        <h2>Inicializar Banco</h2>
        <p>Cria/verifica as tabelas no MySQL.</p>
        <button class="btn" onclick="postSemData('/admin/init-db')">Executar</button>
      </div>

      <div class="card">
        <h2>Importar WS601</h2>
        <p>Importar rotas por período.</p>
        <input type="date" id="ws601_ini">
        <input type="date" id="ws601_fim">
        <button class="btn" onclick="importar('/importar/ws601','ws601_ini','ws601_fim')">Importar WS601</button>
      </div>

      <div class="card">
        <h2>Importar WS613</h2>
        <p>Importar documentos por período.</p>
        <input type="date" id="ws613_ini">
        <input type="date" id="ws613_fim">
        <button class="btn" onclick="importar('/importar/ws613','ws613_ini','ws613_fim')">Importar WS613</button>
      </div>

      <div class="card">
        <h2>Importar Tudo</h2>
        <p>Importar WS601 + WS613 no mesmo período.</p>
        <input type="date" id="tudo_ini">
        <input type="date" id="tudo_fim">
        <button class="btn" onclick="importar('/importar/tudo','tudo_ini','tudo_fim')">Importar Tudo</button>
      </div>

      <div class="card">
        <h2>Teste WS204</h2>
        <p>Consultar status por chave NF-e.</p>
        <input type="text" id="chave_ws204" placeholder="Chave da NF-e">
        <button class="btn" onclick="testeWs204()">Testar</button>
      </div>

    </div>

    <pre id="resultado">Resultado aparecerá aqui...</pre>
  </div>

<script>
  function hoje() {
    return new Date().toISOString().slice(0, 10);
  }

  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.value = hoje();
  });

  async function importar(url, idIni, idFim) {
    const data_inicial = document.getElementById(idIni).value;
    const data_final = document.getElementById(idFim).value;

    document.getElementById('resultado').textContent = 'Processando...';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_inicial,
          data_final
        })
      });

      const data = await response.json();

      document.getElementById('resultado').textContent =
        JSON.stringify(data, null, 2);

    } catch (err) {
      document.getElementById('resultado').textContent = err.message;
    }
  }

  async function postSemData(url) {
    document.getElementById('resultado').textContent = 'Processando...';

    try {
      const response = await fetch(url, {
        method: 'POST'
      });

      const data = await response.json();

      document.getElementById('resultado').textContent =
        JSON.stringify(data, null, 2);

    } catch (err) {
      document.getElementById('resultado').textContent = err.message;
    }
  }

  async function testeWs204() {
    const key = document.getElementById('chave_ws204').value;

    document.getElementById('resultado').textContent = 'Consultando...';

    try {
      const response = await fetch('/teste-ws204?key=' + encodeURIComponent(key));
      const data = await response.json();

      document.getElementById('resultado').textContent =
        JSON.stringify(data, null, 2);

    } catch (err) {
      document.getElementById('resultado').textContent = err.message;
    }
  }
</script>

</body>
</html>
  `);
});

app.post('/admin/init-db', async (req, res) => {
  try {
    const result = await initDb();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.get('/debug-comprovei', (req, res) => {
  res.json({
    COMPROVEI_USER: process.env.COMPROVEI_USER,
    COMPROVEI_PASSWORD_EXISTE: !!process.env.COMPROVEI_PASSWORD,
    tamanhoSenha: process.env.COMPROVEI_PASSWORD?.length || 0
  });
});

app.get('/teste-ws204', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.comprovei.com.br/api/1.1/documents/getStatus?key=' + req.query.key,
      {
        method: 'GET',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `${process.env.COMPROVEI_USER}:${process.env.COMPROVEI_PASSWORD}`
            ).toString('base64')
        }
      }
    );

    const data = await response.json();

    res.json({
      ok: true,
      status: response.status,
      retorno: data
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      erro: error.message
    });
  }
});

app.use('/importar', importRoutes);
app.use('/dados', dataRoutes);

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Servidor rodando na porta ${port}`);

  try {
    await initDb();
    console.log('Tabelas verificadas/criadas');
  } catch (err) {
    console.error('Erro ao inicializar tabelas:', err.message);
  }

  startScheduler();
});
