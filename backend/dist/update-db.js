import pool from './config/database.js';
async function updateDatabase() {
    try {
        console.log('Atualizando banco de dados...');
        // Adicionar novas colunas na tabela customers
        const alterQueries = [
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_type ENUM('CLIENTE', 'FAMILIAR', 'OUTRO') DEFAULT 'CLIENTE'`,
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100)`,
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20)`,
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_secondary_type ENUM('CLIENTE', 'FAMILIAR', 'OUTRO') DEFAULT 'CLIENTE'`,
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)`,
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_observations TEXT`,
            `ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10)`,
            // Dados do Aparelho - Tabela devices
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS storage VARCHAR(20)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS screen_password VARCHAR(100)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS battery_health VARCHAR(20)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_return BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS condition_screen_ok BOOLEAN`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS condition_case_ok BOOLEAN`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS condition_camera_ok BOOLEAN`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS condition_impact_signs BOOLEAN`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS condition_liquid_damage_signs BOOLEAN`,
            // Dados da Entrada no Suporte - Tabela devices
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS entry_date TIMESTAMP NULL`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS entry_method ENUM('loja', 'motoboy', 'outro') DEFAULT 'loja'`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS received_by VARCHAR(100)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS priority ENUM('baixa', 'media', 'alta') DEFAULT 'media'`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS estimated_deadline TIMESTAMP NULL`,
            // Dados da Compra e Garantias - Tabela devices
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP NULL`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_period_months INT`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_end_date TIMESTAMP NULL`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(36)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(100)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS stock_entry_date TIMESTAMP NULL`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS supplier_warranty_months INT`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS supplier_warranty_end_date TIMESTAMP NULL`,
            // Aparelho Reserva - Tabela devices
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS has_loaner_device BOOLEAN`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS loaner_model VARCHAR(100)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS loaner_imei VARCHAR(100)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS loaner_delivery_date TIMESTAMP NULL`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS liability_term BOOLEAN`,
            // Uploads e Anexos - Tabela devices
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS entry_video_url VARCHAR(500)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS exit_video_url VARCHAR(500)`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_documentation_urls JSON`,
            `ALTER TABLE devices ADD COLUMN IF NOT EXISTS additional_documents_urls JSON`,
            `ALTER TABLE tickets MODIFY COLUMN status ENUM('Recebido em loja', 'Aguardando análise', 'Em análise', 'Enviado para técnico', 'Aguardando peça (São Paulo)', 'Em reparo', 'Pronto', 'Aguardando cliente retirar em loja', 'Saiu para entrega (motoboy)', 'Entregue ao cliente', 'Troca realizada', 'Cancelado/sem solução') NOT NULL DEFAULT 'Recebido em loja'`,
            // Campos de Encerramento
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP NULL`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS return_method ENUM('Retirada em loja', 'Motoboy entregou') NULL`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_result ENUM('Reparado', 'Trocado', 'Sem defeito constatado', 'Negado garantia', 'Outro') NULL`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS repair_warranty_days INT DEFAULT 0`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS final_observations TEXT`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS delivery_confirmed BOOLEAN DEFAULT FALSE`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS signature_url TEXT`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS swap_device_info JSON`,
            `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS warranty_denial_info JSON`,
            // Tabela de Agendamentos
            `CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(36) PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        ticket_id VARCHAR(36),
        type ENUM('Para dar entrada no suporte', 'Problema resolvido', 'Retorno') NOT NULL,
        method ENUM('Retirada em loja', 'Motoboy') NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        status ENUM('Pendente', 'Concluído', 'Cancelado') DEFAULT 'Pendente',
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
      )`,
            // Tabela de Transações Financeiras
            `CREATE TABLE IF NOT EXISTS financial_transactions (
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
      )`,
            `ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS attachment_url TEXT`,
            `ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255)`,
            `ALTER TABLE devices MODIFY COLUMN customer_id VARCHAR(36) NULL`,
            `ALTER TABLE tickets MODIFY COLUMN customer_id VARCHAR(36) NULL`,
            `CREATE TABLE IF NOT EXISTS financial_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        action ENUM('CREATE', 'DELETE') NOT NULL,
        transaction_details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
        ];
        for (const query of alterQueries) {
            try {
                await pool.execute(query);
                console.log('✅ Coluna adicionada ou ja existente');
            }
            catch (err) {
                if (err.message.includes('Duplicate column')) {
                    console.log('ℹ️ Coluna ja existe');
                }
                else {
                    console.error('❌ Erro:', err.message);
                }
            }
        }
        console.log('✅ Banco de dados atualizado com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('Erro ao atualizar banco:', error);
        process.exit(1);
    }
}
updateDatabase();
//# sourceMappingURL=update-db.js.map