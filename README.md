# API Comprovei WS601 + WS613 com Node, Railway e MySQL

Sistema para importar automaticamente relatórios da Comprovei:

- WS601 - Rotas
- WS613 - Documentos
- Agendamento diário
- Histórico de importações
- Banco MySQL
- Endpoints para Power BI ou testes manuais

## 1. Variáveis no Railway

Crie um projeto no Railway, adicione um banco MySQL e cadastre as variáveis:

```env
COMPROVEI_USER=seu_usuario
COMPROVEI_PASSWORD=sua_senha
CRON_ENABLED=true
CRON_TIME=0 5 * * *
CRON_TIMEZONE=America/Sao_Paulo
IMPORT_DAYS_BACK=1
```

O Railway cria automaticamente as variáveis do MySQL:

```env
MYSQLHOST=
MYSQLPORT=
MYSQLUSER=
MYSQLPASSWORD=
MYSQLDATABASE=
```

## 2. Rodar local

```bash
npm install
cp .env.example .env
npm run init-db
npm run dev
```

## 3. Deploy no Railway

Suba este projeto no GitHub e conecte no Railway usando **Deploy from GitHub Repo**.

O comando de start será:

```bash
npm start
```

## 4. Endpoints principais

### Testar servidor

```http
GET /
```

### Criar/atualizar tabelas

```http
POST /admin/init-db
```

### Importar WS601 manualmente

```http
POST /importar/ws601
Content-Type: application/json

{
  "data_inicial": "2026-06-01",
  "data_final": "2026-06-01"
}
```

### Importar WS613 manualmente

```http
POST /importar/ws613
Content-Type: application/json

{
  "data_inicial": "2026-06-01",
  "data_final": "2026-06-01"
}
```

### Importar tudo manualmente

```http
POST /importar/tudo
Content-Type: application/json

{
  "data_inicial": "2026-06-01",
  "data_final": "2026-06-01"
}
```

### Consultar rotas importadas

```http
GET /dados/rotas?data_inicial=2026-06-01&data_final=2026-06-01
```

### Consultar documentos importados

```http
GET /dados/documentos?data_inicial=2026-06-01&data_final=2026-06-01
```

### Consultar histórico

```http
GET /dados/historico
```

## 5. Como funciona a gravação

O sistema grava os dados em tabelas genéricas e seguras para Power BI:

- `comprovei_ws601_rotas`
- `comprovei_ws613_documentos`
- `comprovei_importacoes`

Cada linha importada guarda:

- hash único da linha
- período importado
- data de importação
- dados originais em JSON
- colunas principais normalizadas

Isso evita erro quando a Comprovei altera colunas ou quando algum campo vem vazio.

## 6. Agendamento diário

Por padrão, o sistema importa automaticamente **ontem** todos os dias às 05:00 no timezone `America/Sao_Paulo`.

Altere no Railway:

```env
CRON_TIME=0 5 * * *
IMPORT_DAYS_BACK=1
```

## 7. Observação importante

A API da Comprovei limita o intervalo máximo a 31 dias. Para cargas antigas, rode várias chamadas por mês.
