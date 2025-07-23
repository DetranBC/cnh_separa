const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Banco de dados SQLite salvo na pasta do projeto
const db = new sqlite3.Database(path.join(__dirname, 'lotes.db'));

// Cria tabela, se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS lotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT,
      tipo TEXT,
      status TEXT,
      criadoEm TEXT,
      criadoPor TEXT
    )
  `);
});

// Endpoints
app.get('/lotes', (req, res) => {
  db.all('SELECT * FROM lotes', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/lotes', (req, res) => {
  const { numero, tipo, status, criadoEm, criadoPor } = req.body;
  db.run(
    'INSERT INTO lotes (numero, tipo, status, criadoEm, criadoPor) VALUES (?, ?, ?, ?, ?)',
    [numero, tipo, status, criadoEm, criadoPor],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/lotes/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM lotes WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Agora roda na porta 3001
app.listen(3001, () => {
  console.log('API rodando em http://localhost:3001');
});
