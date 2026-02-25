import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function initDatabase() {
    try {
        // Conectar sem database específico (usando callback API)
        const connection = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });
        console.log('✅ Conectado ao MySQL');
        // Criar banco de dados
        await new Promise((resolve, reject) => {
            connection.query('CREATE DATABASE IF NOT EXISTS fixtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        console.log('✅ Banco de dados fixtrack criado/verificado');
        // Usar o banco
        await new Promise((resolve, reject) => {
            connection.query('USE fixtrack', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        // Ler e executar o script SQL
        const sqlScript = fs.readFileSync(path.join(__dirname, 'db-init.sql'), 'utf8');
        // Remover linhas de comentário e CREATE DATABASE/USE
        const cleanScript = sqlScript
            .replace(/--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/CREATE DATABASE.*?;/gi, '')
            .replace(/USE \w+;/gi, '');
        await new Promise((resolve, reject) => {
            connection.query(cleanScript, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        console.log('✅ Tabelas criadas/verificadas');
        console.log('✅ Banco de dados inicializado com sucesso!');
        connection.end();
    }
    catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}
initDatabase();
//# sourceMappingURL=init-db.js.map