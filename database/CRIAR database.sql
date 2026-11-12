CREATE DATABASE carros;

USE carros;

-- =========================================
-- 1. MARCAS
-- =========================================
CREATE TABLE marcas (
    marca_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    origem VARCHAR(100)
) ENGINE=InnoDB;

-- =========================================
-- 2. MODELOS
-- =========================================
CREATE TABLE modelos (
    modelo_id INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(100) NOT NULL,
    marca_id INT NOT NULL,
    transmissao VARCHAR(50) NOT NULL,
    combustivel VARCHAR(50) NOT NULL,
    motor VARCHAR(50) NOT NULL,
    FOREIGN KEY (marca_id)
        REFERENCES marcas(marca_id),
    UNIQUE (marca_id, modelo)
) ENGINE=InnoDB;

-- =========================================
-- 3. CLIENTES
-- =========================================
CREATE TABLE clientes (
    cliente_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    sobrenome VARCHAR(120) NOT NULL,
    cpf CHAR(11) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(120),
    endereco VARCHAR(200),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================
-- 4. PONTOS DE VENDA
-- =========================================
CREATE TABLE pontos_venda (
    ponto_id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo'
) ENGINE=InnoDB;

-- =========================================
-- 5. FUNCIONARIOS
-- =========================================
CREATE TABLE funcionarios (
    funcionario_id INT AUTO_INCREMENT PRIMARY KEY,
    ponto_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    cpf CHAR(11) UNIQUE,
    email VARCHAR(120),
    telefone VARCHAR(20),
    cargo VARCHAR(60),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    FOREIGN KEY (ponto_id)
        REFERENCES pontos_venda(ponto_id)
) ENGINE=InnoDB;

-- =========================================
-- 6. VEICULOS
-- =========================================
CREATE TABLE veiculos (
    veiculo_id INT AUTO_INCREMENT PRIMARY KEY,
    modelo_id INT NOT NULL,
    ano INT NOT NULL,
    cor VARCHAR(40),
    quilometragem INT DEFAULT 0,
    placa VARCHAR(7) UNIQUE,
    preco DECIMAL(12,2) NOT NULL,
    descricao TEXT,
    status ENUM(
        'disponivel',
        'reservado',
        'vendido'
    ) DEFAULT 'disponivel',
    FOREIGN KEY (modelo_id)
        REFERENCES modelos(modelo_id)
) ENGINE=InnoDB;

-- =========================================
-- 7. ESTOQUE
-- =========================================
CREATE TABLE estoque (
    estoque_id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT NOT NULL UNIQUE,
    ponto_id INT NOT NULL,
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (veiculo_id)
        REFERENCES veiculos(veiculo_id),
    FOREIGN KEY (ponto_id)
        REFERENCES pontos_venda(ponto_id)
) ENGINE=InnoDB;

-- =========================================
-- 8. VENDAS
-- =========================================
CREATE TABLE vendas (
    venda_id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    veiculo_id INT NOT NULL UNIQUE,
    funcionario_id INT NOT NULL,
    ponto_id INT NOT NULL,
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor_venda DECIMAL(12,2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    status ENUM(
        'concluida',
        'cancelada'
    ) DEFAULT 'concluida',
    FOREIGN KEY (cliente_id)
        REFERENCES clientes(cliente_id),
    FOREIGN KEY (veiculo_id)
        REFERENCES veiculos(veiculo_id),
    FOREIGN KEY (funcionario_id)
        REFERENCES funcionarios(funcionario_id),
    FOREIGN KEY (ponto_id)
        REFERENCES pontos_venda(ponto_id)
) ENGINE=InnoDB;

-- =========================================
-- 9. Movimentações
-- =========================================
CREATE TABLE estoque_movimentacoes (
    movimentacao_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT NOT NULL,
    ponto_origem INT NOT NULL,
    ponto_destino INT NOT NULL,
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(255),
    FOREIGN KEY (veiculo_id)
        REFERENCES veiculos(veiculo_id),
    FOREIGN KEY (ponto_origem)
        REFERENCES pontos_venda(ponto_id),
    FOREIGN KEY (ponto_destino)
        REFERENCES pontos_venda(ponto_id)
) ENGINE=InnoDB;

---------------------------------------
--Inserindo valores de exemplo
---------------------------------------

-- 1. Inserindo marcas
INSERT INTO marcas (nome, origem) VALUES
	('Toyota', 'Japão'),
	('Volkswagen', 'Alemanha'),
	('Chevrolet', 'Estados Unidos'),
	('Fiat', 'Itália'),
	('Honda', 'Japão'),
	('Ford', 'Estados Unidos'),
	('Hyundai', 'Coreia do Sul'),
	('BMW', 'Alemanha'),
	('Renault', 'França'),
	('Nissan', 'Japão');

-- 2. Inserindo modelos
INSERT INTO modelos
	(modelo, marca_id, transmissao, combustivel, motor)
VALUES
	('Corolla', 1, 'Automática', 'Flex', '2.0'),
	('Hilux', 1, 'Automática', 'Diesel', '2.8'),
	('Gol', 2, 'Manual', 'Flex', '1.0'),
	('T-Cross', 2, 'Automática', 'Flex', '1.0 Turbo'),
	('Onix', 3, 'Manual', 'Flex', '1.0'),
	('Tracker', 3, 'Automática', 'Flex', '1.2 Turbo'),
	('Argo', 4, 'Manual', 'Flex', '1.0'),
	('Toro', 4, 'Automática', 'Diesel', '2.0'),
	('Civic', 5, 'Automática', 'Híbrido', '2.0'),
	('HR-V', 5, 'Automática', 'Flex', '1.5'),
	('Ranger', 6, 'Automática', 'Diesel', '3.0'),
	('HB20', 7, 'Manual', 'Flex', '1.0'),
	('320i', 8, 'Automática', 'Gasolina', '2.0 Turbo'),
	('Kwid', 9, 'Manual', 'Flex', '1.0'),
	('Kicks', 10, 'Automática', 'Flex', '1.6');
    
-- 3. Inserindo clientes fictícios
INSERT INTO clientes
	(nome, sobrenome, cpf, telefone, email, endereco)
VALUES
	('João', 'Silva', '12345678901', '44999990001', 'joao@email.com', 'Rua A, 100'),
	('Maria', 'Santos', '23456789012', '44999990002', 'maria@email.com', 'Rua B, 200'),
	('Pedro', 'Oliveira', '34567890123', '44999990003', 'pedro@email.com', 'Rua C, 300'),
	('Ana', 'Costa', '45678901234', '44999990004', 'ana@email.com', 'Rua D, 400'),
	('Lucas', 'Pereira', '56789012345', '44999990005', 'lucas@email.com', 'Rua E, 500'),
	('Julia', 'Almeida', '67890123456', '44999990006', 'julia@email.com', 'Rua F, 600'),
	('Gabriel', 'Ferreira', '78901234567', '44999990007', 'gabriel@email.com', 'Rua G, 700'),
	('Beatriz', 'Rodrigues', '89012345678', '44999990008', 'beatriz@email.com', 'Rua H, 800'),
	('Rafael', 'Martins', '90123456789', '44999990009', 'rafael@email.com', 'Rua I, 900'),
	('Camila', 'Souza', '01234567890', '44999990010', 'camila@email.com', 'Rua J, 1000');	
    
-- 4. Ponto de Venda
INSERT INTO pontos_venda
	(nome, endereco, telefone)
VALUES
	('AutoManager - Matriz', 'Avenida Brasil, 1000', '4433331000'),
	('AutoManager - Filial Centro', 'Rua Paraná, 250', '4433332000'),
	('AutoManager - Filial Norte', 'Avenida Paraná, 800', '4433333000');

-- 5. Funcionários
INSERT INTO funcionarios
	(ponto_id, nome, cpf, email, telefone, cargo)
VALUES
	(1, 'Carlos Mendes', '11111111111', 'carlos@automanager.com', '44988880001', 'Gerente'),
	(1, 'Fernanda Lima', '22222222222', 'fernanda@automanager.com', '44988880002', 'Vendedora'),
	(2, 'Ricardo Alves', '33333333333', 'ricardo@automanager.com', '44988880003', 'Gerente'),
	(2, 'Mariana Rocha', '44444444444', 'mariana@automanager.com', '44988880004', 'Vendedora'),
	(3, 'Eduardo Gomes', '55555555555', 'eduardo@automanager.com', '44988880005', 'Gerente'),
	(3, 'Patricia Dias', '66666666666', 'patricia@automanager.com', '44988880006', 'Vendedora');

-- 6. Veículos
INSERT INTO veiculos
	(modelo_id, ano, cor, quilometragem, placa, preco, descricao, status)
VALUES
	(1, 2023, 'Preto', 25000, 'ABC1D23', 125000.00, 'Corolla seminovo, completo', 'disponivel'),
	(2, 2022, 'Prata', 35000, 'DEF2G34', 210000.00, 'Hilux em excelente estado', 'disponivel'),
	(3, 2020, 'Branco', 45000, 'GHI3J45', 42000.00, 'Gol econômico e conservado', 'disponivel'),
	(4, 2024, 'Cinza', 12000, 'JKL4M56', 135000.00, 'T-Cross com baixa quilometragem', 'disponivel'),
	(5, 2023, 'Vermelho', 18000, 'MNO5P67', 85000.00, 'Onix completo', 'vendido'),
	(6, 2024, 'Branco', 9000, 'PQR6S78', 145000.00, 'Tracker seminovo', 'disponivel'),
	(7, 2022, 'Prata', 30000, 'STU7V89', 75000.00, 'Argo em ótimo estado', 'disponivel'),
	(8, 2023, 'Preto', 22000, 'VWX8Y90', 165000.00, 'Toro diesel', 'disponivel'),
	(9, 2024, 'Azul', 5000, 'YZA9B12', 195000.00, 'Civic híbrido', 'disponivel'),
	(10, 2023, 'Cinza', 15000, 'BCD1E23', 145000.00, 'HR-V seminovo', 'disponivel'),
	(11, 2024, 'Branco', 8000, 'EFG2H34', 250000.00, 'Ranger diesel', 'disponivel'),
	(12, 2022, 'Prata', 28000, 'HIJ3K45', 78000.00, 'HB20 econômico', 'disponivel'),
	(13, 2023, 'Preto', 12000, 'KLM4N56', 230000.00, 'BMW 320i', 'vendido'),
	(14, 2021, 'Branco', 40000, 'NOP5Q67', 55000.00, 'Kwid seminovo', 'vendido'),
	(15, 2024, 'Cinza', 7000, 'QRS6T78', 125000.00, 'Nissan Kicks', 'vendido');

-- 7. Estoque
INSERT INTO estoque (veiculo_id, ponto_id) VALUES
	(1, 1),
	(2, 1),
	(3, 1),
	(4, 1),
	(6, 2),
	(7, 2),
	(8, 2),
	(9, 3),
	(10, 3),
	(11, 3),
	(12, 3);
    
-- 8. Vendas
INSERT INTO vendas
	(cliente_id, veiculo_id, funcionario_id, ponto_id, data_venda, valor_venda, forma_pagamento, status)
VALUES
	(1, 13, 2, 1, '2026-08-15 10:30:00', 225000.00, 'Financiamento', 'concluida'),
	(2, 14, 4, 2, '2026-09-20 14:00:00', 52000.00, 'PIX', 'concluida'),
	(3, 15, 6, 3, '2026-10-10 16:45:00', 120000.00, 'À vista', 'concluida'),
    (5, 5, 2, 1, '2026-10-12 12:50:00', 82000.00, 'Financiamento', 'concluida');