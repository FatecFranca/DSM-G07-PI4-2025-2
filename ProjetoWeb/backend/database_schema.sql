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
    id_user INT NOT NULL REFERENCES tb_usuarios(id) ON DELETE CASCADE,

    nome_disp VARCHAR(100) NOT NULL,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    consumo_iot NUMERIC(10,2),
    endereco VARCHAR(200) NOT NULL
);

CREATE INDEX idx_dispositivos_id_user ON tb_dispositivos(id_user);

-- ============================
-- TABELA: tb_fatura
-- ============================
CREATE TABLE tb_fatura (
    id SERIAL PRIMARY KEY,

    id_disp INT NOT NULL REFERENCES tb_dispositivos(id) ON DELETE CASCADE,
    id_user INT NOT NULL REFERENCES tb_usuarios(id) ON DELETE CASCADE,

    data DATE NOT NULL,

    consumo_estimado NUMERIC(10,2) NOT NULL,
    consumo_iot NUMERIC(10,2) NOT NULL,
    valor_pago NUMERIC(10,2) NOT NULL,
    preco_kwh NUMERIC(10,4) NOT NULL
);

CREATE INDEX idx_fatura_id_disp ON tb_fatura(id_disp);
CREATE INDEX idx_fatura_id_user ON tb_fatura(id_user);

-- ============================
-- TRIGGER: valida se o dispositivo pertence a um usuário
-- ============================
CREATE OR REPLACE FUNCTION check_bill_device_owner()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM 1 
    FROM tb_dispositivos 
    WHERE id = NEW.id_disp AND id_user IS NOT NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Device does not exist or is not owned by a user';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_bill_device_owner
BEFORE INSERT OR UPDATE ON tb_fatura
FOR EACH ROW 
EXECUTE FUNCTION check_bill_device_owner();

-- ============================
-- TABELA: tb_consumo_horario (NOVO)
-- ============================
CREATE TABLE tb_consumo_horario (
    id SERIAL PRIMARY KEY,

    id_disp INT NOT NULL REFERENCES tb_dispositivos(id) ON DELETE CASCADE,

    timestamp_fim TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

    consumo_wh NUMERIC(10, 4) NOT NULL
);

-- Índice para otimizar buscas por dispositivo + período
CREATE INDEX idx_consumo_horario_disp_time 
ON tb_consumo_horario(id_disp, timestamp_fim);
