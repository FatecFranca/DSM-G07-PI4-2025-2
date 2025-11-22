# Estrutura do Banco de Dados

## Tabelas Necessárias

O banco de dados precisa ter 3 tabelas principais:

### 1. `tb_usuarios` - Usuários do Sistema
```sql
- id (SERIAL PRIMARY KEY)
- nome (VARCHAR(100)) - Nome completo do usuário
- email (VARCHAR(150) UNIQUE) - Email único
- senha (TEXT) - Hash da senha (bcrypt)
```

### 2. `tb_dispositivos` - Dispositivos IoT
```sql
- id (SERIAL PRIMARY KEY)
- nome_disp (VARCHAR(100)) - Nome do dispositivo
- codigo (VARCHAR(100) UNIQUE) - Código de identificação único
- endereco (VARCHAR(200)) - Endereço do imóvel
```

### 3. `tb_fatura` - Faturas de Energia
```sql
- id (SERIAL PRIMARY KEY)
- id_disp (INT) - FK para tb_dispositivos
- data (DATE) - Data da fatura (mês/ano)
- consumo_estimado (VARCHAR(20)) - Consumo informado pela empresa
- consumo_real (VARCHAR(20)) - Consumo real medido (opcional)
- valor_pago (VARCHAR(20)) - Valor pago na fatura
- preco_kwh (VARCHAR(20)) - Preço por kWh
```

## Como Criar as Tabelas

### Opção 1: Usando o Script de Migração (Recomendado)
```bash
cd backend
npm run migrate
```

### Opção 2: Executando o SQL Manualmente
Execute o arquivo `database_schema.sql` no seu banco PostgreSQL:
```bash
psql -h seu_host -U seu_usuario -d seu_banco -f database_schema.sql
```

### Opção 3: Via Interface Gráfica
1. Abra seu cliente PostgreSQL (pgAdmin, DBeaver, etc.)
2. Conecte ao banco de dados
3. Execute o conteúdo do arquivo `database_schema.sql`

## Relacionamentos

- `tb_fatura.id_disp` → `tb_dispositivos.id` (Foreign Key)

## Observações Importantes

- Os campos numéricos (`consumo_estimado`, `consumo_real`, `valor_pago`, `preco_kwh`) são armazenados como `VARCHAR(20)` no banco, mas são convertidos para números no backend
- O campo `codigo` em `tb_dispositivos` é UNIQUE, garantindo que não haja códigos duplicados
- O campo `email` em `tb_usuarios` é UNIQUE, garantindo que não haja emails duplicados

## Verificação

Após criar as tabelas, você pode verificar com:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tb_usuarios', 'tb_dispositivos', 'tb_fatura');
```

