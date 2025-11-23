# Projeto Web - Gestão de Energia Elétrica

Sistema completo para monitoramento e análise de consumo de energia elétrica, permitindo comparar o consumo informado pela empresa fornecedora com dados reais coletados por dispositivos IoT.

## 📋 Índice

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração e Instalação](#configuração-e-instalação)
- [Como Rodar o Backend](#como-rodar-o-backend)
- [Como Rodar o Frontend](#como-rodar-o-frontend)
- [Funcionalidades](#funcionalidades)
- [API - Endpoints](#api---endpoints)
- [Cálculos Estatísticos](#cálculos-estatísticos)
- [Dashboard](#dashboard)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [Arquitetura](#arquitetura)

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT (JSON Web Tokens)** - Autenticação
- **bcryptjs** - Hash de senhas
- **pg** - Cliente PostgreSQL

### Frontend
- **React** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **Chart.js / react-chartjs-2** - Gráficos e visualizações
- **Tailwind CSS** - Framework CSS
- **Shadcn UI** - Componentes de interface
- **Radix UI** - Componentes acessíveis

## 📁 Estrutura do Projeto

```
ProjetoWeb/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Lógica de negócio
│   │   ├── models/        # Acesso ao banco de dados
│   │   ├── routes/        # Definição de rotas
│   │   ├── middleware/    # Middlewares (auth, etc)
│   │   ├── config/       # Configurações (DB, migrations)
│   │   └── pages/        # Documentação HTML da API
│   ├── database_schema.sql
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Serviços de API
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilitários
│   └── package.json
│
└── README.md
```

## 📦 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **PostgreSQL** (versão 12 ou superior)
- **Git**

## ⚙️ Configuração e Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd ProjetoWeb
```

### 2. Configure o Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
JWT_SECRET=sua-chave-secreta-aqui
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Configure o Banco de Dados

Execute a migração para criar as tabelas:

```bash
npm run migrate
```

Ou execute manualmente o arquivo `database_schema.sql` no seu banco PostgreSQL.

### 4. Configure o Frontend

```bash
cd ../frontend
npm install
```

Crie um arquivo `.env` na pasta `frontend/` (opcional, se necessário):

```env
VITE_API_URL=http://localhost:3001/api
```

## 🚀 Como Rodar o Backend

1. Navegue até a pasta `backend`:
```bash
cd backend
```

2. Inicie o servidor em modo desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001`

**Scripts disponíveis:**
- `npm run dev` - Inicia o servidor com watch mode
- `npm start` - Inicia o servidor em produção
- `npm run migrate` - Executa migrações do banco de dados

## 🎨 Como Rodar o Frontend

1. Navegue até a pasta `frontend`:
```bash
cd frontend
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

**Scripts disponíveis:**
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção

## ✨ Funcionalidades

### Autenticação
- Registro de novos usuários
- Login com JWT
- Proteção de rotas autenticadas

### Dispositivos
- Cadastro de dispositivos IoT
- Listagem de dispositivos do usuário
- Edição e exclusão de dispositivos
- Associação de consumo IoT aos dispositivos

### Faturas
- Cadastro de faturas de energia
- Comparação entre consumo informado e IoT
- Análise de pagamento (correto, pagando a mais, pagando a menos)
- Histórico completo de faturas

### Dashboard
- Visão geral do consumo
- Gráficos comparativos
- Análises estatísticas avançadas
- Probabilidade de próxima fatura

## 🔌 API - Endpoints

### Autenticação

#### `POST /api/auth/register`
Registra um novo usuário.

**Body:**
```json
{
  "fullName": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

#### `POST /api/auth/login`
Autentica um usuário e retorna token JWT.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

#### `GET /api/auth/me`
Retorna informações do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

### Dispositivos

Todas as rotas de dispositivos exigem autenticação.

#### `GET /api/devices`
Lista todos os dispositivos do usuário autenticado.

#### `GET /api/devices/:id`
Retorna um dispositivo específico.

#### `POST /api/devices`
Cria um novo dispositivo.

**Body:**
```json
{
  "name": "Medidor Principal",
  "property_address": "Rua das Flores, 123"
}
```

#### `PUT /api/devices/:id`
Atualiza um dispositivo existente.

#### `DELETE /api/devices/:id`
Remove um dispositivo.

### Faturas

Todas as rotas de faturas exigem autenticação.

#### `GET /api/bills`
Lista todas as faturas do usuário autenticado.

#### `GET /api/bills/:id`
Retorna uma fatura específica.

#### `POST /api/bills`
Cria uma nova fatura.

**Body:**
```json
{
  "device_id": 1,
  "month_year": "2024-09",
  "company_consumption_kwh": 300,
  "consumo_iot": 275.5,
  "amount_paid": 200.75,
  "price_per_kwh": 0.65
}
```

#### `PUT /api/bills/:id`
Atualiza uma fatura existente.

#### `DELETE /api/bills/:id`
Remove uma fatura.

### Dashboard

Todas as rotas de dashboard exigem autenticação.

#### `GET /api/dashboard`
Retorna dados gerais do dashboard (lista de faturas).

#### `GET /api/dashboard/analytics`
Retorna análises estatísticas completas:
- Distribuição por dispositivo
- Média geral e por dispositivo
- Desvio padrão
- Correlações
- Regressão linear

#### `GET /api/dashboard/media-geral`
Retorna a média geral do valor de todas as faturas.

**Resposta:**
```json
{
  "mediaGeral": 250.50
}
```

#### `GET /api/dashboard/desvio-padrao`
Retorna o desvio padrão do valor de todas as faturas.

**Resposta:**
```json
{
  "desvioPadrao": 45.23
}
```

#### `GET /api/dashboard/probabilidade-proximo-mes?min=200&max=300`
Calcula a probabilidade da próxima fatura estar entre dois valores usando distribuição normal.

**Query Parameters:**
- `min` (obrigatório): Valor mínimo do intervalo
- `max` (obrigatório): Valor máximo do intervalo

**Resposta:**
```json
{
  "probabilidadeProximoMes": 72.50
}
```

## 📊 Cálculos Estatísticos

### Média Geral
Calcula a média aritmética de todos os valores pagos nas faturas:

```
Média = Σ(valor_pago) / quantidade_de_faturas
```

### Desvio Padrão
Calcula a variabilidade dos valores pagos:

```
Desvio = √(Σ(valor - média)² / n)
```

### Média por Dispositivo
Calcula a média de valores pagos agrupados por dispositivo:

```
Média_Dispositivo = Σ(valor_pago_do_dispositivo) / quantidade_de_faturas_do_dispositivo
```

### Probabilidade da Próxima Fatura
Utiliza distribuição normal para calcular a probabilidade de a próxima fatura estar em um intervalo:

1. Calcula z-scores:
   ```
   z_min = (min - média_geral) / desvio_padrão
   z_max = (max - média_geral) / desvio_padrão
   ```

2. Calcula probabilidade usando CDF (Função de Distribuição Acumulada):
   ```
   P(min ≤ X ≤ max) = CDF(z_max) - CDF(z_min)
   ```

3. Converte para porcentagem (0-100%)

**Nota:** A função CDF utiliza aproximação de Abramowitz e Stegun para calcular a distribuição normal padrão.

### Correlação de Pearson
Calcula a correlação entre duas variáveis:

```
r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)
```

Aplicada em:
- Consumo Estimado vs Consumo IoT
- Consumo IoT vs Valor Pago

### Regressão Linear
Calcula a relação linear entre consumo IoT (X) e valor pago (Y):

```
Y = a × X + b
```

Onde:
- `a` (coeficiente angular): `(n×ΣXY - ΣX×ΣY) / (n×ΣX² - (ΣX)²)`
- `b` (intercepto): `(ΣY - a×ΣX) / n`
- `R²` (coeficiente de determinação): Mede o quão bem o modelo se ajusta aos dados

## 📈 Dashboard

O dashboard oferece uma visão completa do consumo de energia:

### Métricas Principais
- **Total de Faturas**: Quantidade total de faturas cadastradas
- **Diferença Total**: Soma das diferenças entre valor pago e valor calculado pelo IoT
- **Contas Corretas**: Quantidade de faturas dentro da tolerância de 5%
- **Pagando a Mais**: Quantidade de faturas onde o valor pago é maior que o valor calculado pelo IoT

### Gráficos

#### Consumo: IoT vs Informado
Gráfico de barras comparando o consumo informado pela empresa com o consumo medido pelo IoT ao longo do tempo.

#### Histórico de Consumo
Gráfico de linha mostrando a evolução do consumo ao longo do tempo.

#### Distribuição por Dispositivo
Gráfico de pizza mostrando o percentual de consumo IoT por dispositivo. As porcentagens são exibidas diretamente nas fatias do gráfico e podem ser ocultadas ao clicar em um dispositivo. O gráfico exibe apenas o gráfico de pizza sem legenda adicional abaixo.

### Análises Estatísticas

#### Média Geral e Desvio Padrão
Cards exibindo a média geral e o desvio padrão de todas as faturas.

#### Probabilidade do Próximo Mês
Permite ao usuário inserir um intervalo (min/max) e calcula a probabilidade da próxima fatura estar nesse intervalo usando distribuição normal.

#### Distribuição Normal
Exibe os parâmetros da distribuição normal (média e desvio padrão).

#### Correlações
Mostra as correlações de Pearson entre:
- Consumo Estimado vs IoT
- Consumo IoT vs Valor Pago

#### Regressão Linear
Exibe os coeficientes da regressão linear (a, b) e o R².

#### Média por Dispositivo
Lista a média de valores pagos agrupados por dispositivo.

## 🗄️ Estrutura do Banco de Dados

### Tabelas

#### `tb_usuarios`
Armazena informações dos usuários do sistema.

```sql
- id (SERIAL PRIMARY KEY)
- nome (VARCHAR(100))
- email (VARCHAR(150) UNIQUE)
- senha (TEXT) -- Hash bcrypt
```

#### `tb_dispositivos`
Armazena dispositivos IoT de medição de energia.

```sql
- id (SERIAL PRIMARY KEY)
- id_user (INT) -- FK para tb_usuarios
- nome_disp (VARCHAR(100))
- codigo (VARCHAR(100) UNIQUE)
- consumo_iot (NUMERIC(10,2))
- endereco (VARCHAR(200))
```

#### `tb_fatura`
Armazena faturas de energia elétrica.

```sql
- id (SERIAL PRIMARY KEY)
- id_disp (INT) -- FK para tb_dispositivos
- id_user (INT) -- FK para tb_usuarios
- data (DATE)
- consumo_estimado (NUMERIC(10,2))
- consumo_iot (NUMERIC(10,2))
- valor_pago (NUMERIC(10,2))
- preco_kwh (NUMERIC(10,4))
```

### Relacionamentos

- `tb_dispositivos.id_user` → `tb_usuarios.id` (CASCADE DELETE)
- `tb_fatura.id_disp` → `tb_dispositivos.id` (CASCADE DELETE)
- `tb_fatura.id_user` → `tb_usuarios.id` (CASCADE DELETE)

### Índices

- `idx_dispositivos_id_user` em `tb_dispositivos(id_user)`
- `idx_fatura_id_disp` em `tb_fatura(id_disp)`
- `idx_fatura_id_user` em `tb_fatura(id_user)`

## 🏗️ Arquitetura

### Backend (MVC)

- **Models** (`src/models/`): Camada de acesso ao banco de dados
  - `User.js` - Operações com usuários
  - `Device.js` - Operações com dispositivos
  - `Bill.js` - Operações com faturas

- **Controllers** (`src/controllers/`): Lógica de negócio e tratamento de requisições
  - `authController.js` - Autenticação
  - `devicesController.js` - Gerenciamento de dispositivos
  - `billsController.js` - Gerenciamento de faturas
  - `dashboardController.js` - Análises e estatísticas

- **Routes** (`src/routes/`): Definição de rotas da API
  - `authRoutes.js`
  - `devicesRoutes.js`
  - `billsRoutes.js`
  - `dashboardRoutes.js`

- **Middleware** (`src/middleware/`): Middlewares customizados
  - `auth.js` - Validação de token JWT

### Frontend (Component-Based)

- **Pages** (`src/pages/`): Páginas principais da aplicação
  - `Login.jsx` - Autenticação
  - `Register.jsx` - Registro
  - `Dashboard.jsx` - Dashboard principal
  - `Devices.jsx` - Gerenciamento de dispositivos
  - `Bills.jsx` - Gerenciamento de faturas

- **Components** (`src/components/`): Componentes reutilizáveis
  - `Layout.jsx` - Layout principal
  - `AppSidebar.jsx` - Barra lateral de navegação
  - `ui/` - Componentes de UI (Shadcn UI)

- **Services** (`src/services/`): Comunicação com a API
  - `api.js` - Funções de chamada à API

- **Hooks** (`src/hooks/`): Custom hooks
  - `useAuth.jsx` - Gerenciamento de autenticação
  - `use-toast.js` - Notificações

## 🔒 Segurança

- Senhas são hasheadas usando bcryptjs
- Autenticação via JWT (JSON Web Tokens)
- Validação de propriedade de recursos (usuários só acessam seus próprios dados)
- Proteção contra SQL injection (usando prepared statements)
- CORS configurado para permitir apenas origens específicas

## 📝 Notas Importantes

- Todos os cálculos estatísticos retornam `0` quando não há dados suficientes ou quando o resultado é `NaN`
- A probabilidade é calculada usando distribuição normal padrão
- As porcentagens no gráfico de pizza são exibidas apenas quando > 3% para melhor legibilidade
- Confirmações de exclusão são exibidas antes de remover dispositivos ou faturas

## 🐛 Troubleshooting

### Erro de conexão com o banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `npm run test:db` (no backend)

### Erro de CORS
- Verifique se `FRONTEND_URL` no `.env` do backend está correto
- Confirme que o frontend está rodando na porta especificada

### Erro de autenticação
- Verifique se o token JWT está sendo enviado no header
- Confirme que `JWT_SECRET` está configurado no backend

## 📄 Licença

Este projeto é parte de um trabalho acadêmico.

---

**Desenvolvido para o projeto DSM-G07-PI4-2025-2**

