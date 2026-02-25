-- FixTrack Pro - Script de Inicialização do Banco de Dados MySQL

CREATE DATABASE IF NOT EXISTS fixtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fixtrack;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    access_level ENUM('ADMIN', 'MANAGER', 'TECHNICIAN') NOT NULL DEFAULT 'TECHNICIAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_type ENUM('CLIENTE', 'FAMILIAR', 'OUTRO') DEFAULT 'CLIENTE',
    contact_name VARCHAR(100),
    phone_secondary VARCHAR(20),
    phone_secondary_type ENUM('CLIENTE', 'FAMILIAR', 'OUTRO') DEFAULT 'CLIENTE',
    cpf VARCHAR(14),
    zip_code VARCHAR(10),
    email VARCHAR(100),
    contact_observations TEXT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Dispositivos
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36),
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    imei_or_serial VARCHAR(100),
    color VARCHAR(30),
    storage VARCHAR(20),
    serial_number VARCHAR(100),
    screen_password VARCHAR(100),
    battery_health VARCHAR(20),
    is_return BOOLEAN DEFAULT FALSE,
    condition_screen_ok BOOLEAN,
    condition_case_ok BOOLEAN,
    condition_camera_ok BOOLEAN,
    condition_impact_signs BOOLEAN,
    condition_liquid_damage_signs BOOLEAN,
    entry_date TIMESTAMP NULL,
    entry_method ENUM('loja', 'motoboy', 'outro') DEFAULT 'loja',
    received_by VARCHAR(100),
    priority ENUM('baixa', 'media', 'alta') DEFAULT 'media',
    estimated_deadline TIMESTAMP NULL,
    has_loaner_device BOOLEAN,
    loaner_model VARCHAR(100),
    loaner_imei VARCHAR(100),
    loaner_delivery_date TIMESTAMP NULL,
    liability_term BOOLEAN,
    entry_video_url VARCHAR(500),
    exit_video_url VARCHAR(500),
    device_documentation_urls JSON,
    additional_documents_urls JSON,
    accessories TEXT,
    observations TEXT,
    -- Dados da Compra e Garantias
    purchase_date TIMESTAMP NULL,
    warranty_period_months INT,
    warranty_end_date TIMESTAMP NULL,
    supplier_id VARCHAR(36),
    supplier_name VARCHAR(100),
    stock_entry_date TIMESTAMP NULL,
    supplier_warranty_months INT,
    supplier_warranty_end_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Tabela de Tickets/Ocorrências
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36),
    device_id VARCHAR(36) NOT NULL,
    problem_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Baixa', 'Média', 'Alta') NOT NULL DEFAULT 'Média',
    status ENUM('Recebido em loja', 'Aguardando análise', 'Em análise', 'Enviado para técnico', 'Aguardando peça (São Paulo)', 'Em reparo', 'Pronto', 'Aguardando cliente retirar em loja', 'Saiu para entrega (motoboy)', 'Entregue ao cliente', 'Troca realizada', 'Cancelado/sem solução') NOT NULL DEFAULT 'Recebido em loja',
    technician_id VARCHAR(36),
    deadline TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    return_method ENUM('Retirada em loja', 'Motoboy entregou') NULL,
    resolution_result ENUM('Reparado', 'Trocado', 'Sem defeito constatado', 'Negado garantia', 'Outro') NULL,
    repair_warranty_days INT DEFAULT 0,
    final_observations TEXT,
    delivery_confirmed BOOLEAN DEFAULT FALSE,
    signature_url TEXT,
    swap_device_info JSON,
    warranty_denial_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Timeline/Histórico
CREATE TABLE IF NOT EXISTS timeline_entries (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Anexos
CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('INCOME', 'EXPENSE') NOT NULL,
    category ENUM('REPARO', 'PECA', 'UBER', 'TAXA_ENTREGA', 'OUTRO') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id VARCHAR(36),
    ticket_id VARCHAR(36),
    status ENUM('PAGO', 'PENDENTE') DEFAULT 'PAGO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- Índices para melhor performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_devices_customer ON devices(customer_id);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_device ON tickets(device_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_technician ON tickets(technician_id);
CREATE INDEX idx_timeline_ticket ON timeline_entries(ticket_id);
CREATE INDEX idx_attachments_ticket ON attachments(ticket_id);
CREATE INDEX idx_financial_date ON financial_transactions(date);
CREATE INDEX idx_financial_customer ON financial_transactions(customer_id);
CREATE INDEX idx_financial_ticket ON financial_transactions(ticket_id);


