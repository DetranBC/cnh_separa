const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do banco de dados - será criado na pasta do projeto
const dbPath = path.join(__dirname, 'cnh_system.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
      } else {
        console.log('Conectado ao banco de dados SQLite em:', dbPath);
        this.initializeTables(); // Agora funciona corretamente
      }
    });

  }

  initializeTables() {
    // Tabela de usuários
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'cfc', 'interno', 'operador')),
        cfc_name TEXT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        require_password_change INTEGER DEFAULT 0
      )
    `);

    // Adiciona a coluna require_password_change se não existir
    this.db.run(`
      ALTER TABLE users ADD COLUMN require_password_change INTEGER DEFAULT 0
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Erro ao adicionar coluna require_password_change:', err.message);
      }
    });
    // Tabela de lotes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS lotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT UNIQUE NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('CNH', 'PID')),
        status TEXT NOT NULL CHECK(status IN ('pendente', 'recebido', 'em_separacao')),
        criado_por TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_por TEXT,
        atualizado_em DATETIME,
        pdf_filename TEXT
      )
    `);

    // Tabela de itens do lote
    this.db.run(`
      CREATE TABLE IF NOT EXISTS lote_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lote_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        cfc TEXT,
        tipo TEXT NOT NULL CHECK(tipo IN ('CNH', 'PID')),
        numero_documento TEXT NOT NULL,
        FOREIGN KEY (lote_id) REFERENCES lotes (id) ON DELETE CASCADE
      )
    `);

    // Criar usuário admin padrão
    this.createDefaultAdmin();
  }

  async createDefaultAdmin() {
    const hashedPassword = await bcrypt.hash('328624', 10);
    
    this.db.run(`
      INSERT OR IGNORE INTO users (username, password, role, name)
      VALUES (?, ?, ?, ?)
    `, ['vini', hashedPassword, 'admin', 'Administrador'], (err) => {
      if (err) {
        console.error('Erro ao criar usuário admin:', err.message);
      } else {
        console.log('Usuário admin criado/verificado com sucesso');
      }
    });
  }

  // Métodos para usuários
  async createUser(userData) {
    const { username, password, role, cfcName, name, requirePasswordChange } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO users (username, password, role, cfc_name, name, require_password_change)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [username, hashedPassword, role, cfcName, name, requirePasswordChange ? 1 : 0], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...userData });
        }
      });
    });
  }

  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM users WHERE username = ?
      `, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT id, username, role, cfc_name, name, created_at, require_password_change FROM users
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateUser(id, userData) {
    const { username, password, role, cfcName, name, requirePasswordChange } = userData;
    let hashedPassword = null;
    
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    return new Promise((resolve, reject) => {
      const query = hashedPassword 
        ? `UPDATE users SET username = ?, password = ?, role = ?, cfc_name = ?, name = ?, require_password_change = ? WHERE id = ?`
        : `UPDATE users SET username = ?, role = ?, cfc_name = ?, name = ?, require_password_change = ? WHERE id = ?`;
      
      const params = hashedPassword 
        ? [username, hashedPassword, role, cfcName, name, requirePasswordChange ? 1 : 0, id]
        : [username, role, cfcName, name, requirePasswordChange ? 1 : 0, id];
      
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM users WHERE id = ?`, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Métodos para lotes
  async createLote(loteData) {
    const { numero, tipo, status, criadoPor, items, pdfFileName } = loteData;
    
    return new Promise((resolve, reject) => {
  const self = this;

  self.db.serialize(() => {
    self.db.run('BEGIN TRANSACTION');

    self.db.run(`
      INSERT INTO lotes (numero, tipo, status, criado_por, pdf_filename)
      VALUES (?, ?, ?, ?, ?)
    `, [numero, tipo, status, criadoPor, pdfFileName], function(err) {
      if (err) {
        self.db.run('ROLLBACK');
        reject(err);
        return;
      }

      const loteId = this.lastID; // aqui o this está OK (do sqlite3)
      const stmt = self.db.prepare(`
        INSERT INTO lote_items (lote_id, nome, cfc, tipo, numero_documento)
        VALUES (?, ?, ?, ?, ?)
      `);

      let itemsInserted = 0;
      let hasError = false;

      items.forEach(item => {
        stmt.run([loteId, item.nome, item.cfc, item.tipo, item.numeroDocumento], (err) => {
          if (err && !hasError) {
            hasError = true;
            self.db.run('ROLLBACK');
            reject(err);
            return;
          }

          itemsInserted++;
          if (itemsInserted === items.length && !hasError) {
            stmt.finalize();
            self.db.run('COMMIT');
            resolve({ id: loteId, ...loteData });
          }
        });
      });
    });
  });
});
  }

  async getAllLotes() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT l.*, 
               GROUP_CONCAT(
                 json_object(
                   'id', li.id,
                   'nome', li.nome,
                   'cfc', li.cfc,
                   'tipo', li.tipo,
                   'numeroDocumento', li.numero_documento
                 )
               ) as items_json
        FROM lotes l
        LEFT JOIN lote_items li ON l.id = li.lote_id
        GROUP BY l.id
        ORDER BY l.criado_em DESC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const lotes = rows.map(row => ({
            id: row.id.toString(),
            numero: row.numero,
            tipo: row.tipo,
            status: row.status,
            criadoPor: row.criado_por,
            criadoEm: row.criado_em,
            atualizadoPor: row.atualizado_por,
            atualizadoEm: row.atualizado_em,
            pdfFileName: row.pdf_filename,
            items: row.items_json ? row.items_json.split(',').map(item => {
              try {
                const parsed = JSON.parse(item);
                return {
                  id: parsed.id.toString(),
                  nome: parsed.nome,
                  cfc: parsed.cfc,
                  tipo: parsed.tipo,
                  numeroDocumento: parsed.numeroDocumento
                };
              } catch (e) {
                return null;
              }
            }).filter(Boolean) : []
          }));
          resolve(lotes);
        }
      });
    });
  }

  async updateLoteStatus(id, status, atualizadoPor) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE lotes 
        SET status = ?, atualizado_por = ?, atualizado_em = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [status, atualizadoPor, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Erro ao fechar o banco de dados:', err.message);
      } else {
        console.log('Conexão com o banco de dados fechada.');
      }
    });
  }
}

module.exports = Database;