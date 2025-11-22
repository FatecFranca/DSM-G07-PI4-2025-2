-- ============================
-- TABELA: tb_usuarios
-- ============================
CREATE TABLE tb_usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha TEXT NOT NULL
);

-- ============================
-- TABELA: tb_dispositivos
-- ============================
CREATE TABLE tb_dispositivos (
    id SERIAL PRIMARY KEY,
    nome_disp VARCHAR(100) NOT NULL,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    endereco VARCHAR(200) NOT NULL
);

-- ============================
-- TABELA: tb_fatura
-- ============================
CREATE TABLE tb_fatura (
    id SERIAL PRIMARY KEY,
    id_disp INT NOT NULL REFERENCES tb_dispositivos(id),
    data DATE NOT NULL,
    consumo_estimado VARCHAR(20),
    consumo_real VARCHAR(20),
    valor_pago VARCHAR(20),
    preco_kwh VARCHAR(20)
);