const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const os = require('os');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'seu-jwt-secret-muito-seguro-aqui';

// Inicializar banco de dados
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Rota raiz para teste no navegador
app.get('/', (req, res) => {
  res.send('✅ Servidor rodando com sucesso! Use as rotas da API em /api');
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        cfcName: user.cfc_name,
        name: user.name,
        requirePasswordChange: user.require_password_change === 1
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        cfcName: user.cfc_name,
        name: user.name,
        requirePasswordChange: user.require_password_change === 1
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de usuários
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const users = await db.getAllUsers();
    const formattedUsers = users.map(user => ({
      id: user.id.toString(),
      username: user.username,
      role: user.role,
      cfcName: user.cfc_name,
      name: user.name,
      createdAt: user.created_at,
      requirePasswordChange: user.require_password_change === 1
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const user = await db.createUser(req.body);
    res.status(201).json({
      id: user.id.toString(),
      username: user.username,
      role: user.role,
      cfcName: user.cfcName,
      name: user.name,
      requirePasswordChange: user.requirePasswordChange || false
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Nome de usuário já existe' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await db.updateUser(req.params.id, req.body);
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await db.deleteUser(req.params.id);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de lotes
app.get('/api/lotes', authenticateToken, async (req, res) => {
  try {
    const lotes = await db.getAllLotes();
    res.json(lotes);
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/lotes', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'operador') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const loteData = JSON.parse(req.body.loteData);
    loteData.pdfFileName = req.file ? req.file.filename : null;
    loteData.criadoPor = req.user.name;

    const lote = await db.createLote(loteData);
    res.status(201).json(lote);
  } catch (error) {
    console.error('Erro ao criar lote:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Número do lote já existe' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

app.put('/api/lotes/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'operador') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { status } = req.body;
    await db.updateLoteStatus(req.params.id, status, req.user.name);
    res.json({ message: 'Status do lote atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status do lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter IPs da máquina (pode ser acessada sem token)
app.get('/api/server-info', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const ips = [];

  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  res.json({
    port: PORT,
    ips,
    hostname: os.hostname()
  });
});

// Iniciar servidor em 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  console.log('\n🚀 Servidor iniciado com sucesso!');
  console.log(`📍 Porta: ${PORT}`);
  console.log('\n🌐 Acesse o sistema pelos seguintes endereços:');
  console.log(`   Local: http://localhost:${PORT}`);
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   Rede: http://${iface.address}:${PORT}`);
      }
    }
  }
  console.log('\n💾 Banco de dados SQLite criado em: server/cnh_system.db');
  console.log('📁 Uploads salvos em: server/uploads/');
  console.log('\n⚠️  Para acessar de outros computadores na rede, use o endereço "Rede" mostrado acima');
});

// Encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n🔄 Encerrando servidor...');
  db.close();
  process.exit(0);
});