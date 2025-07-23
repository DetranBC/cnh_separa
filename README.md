# Sistema de Gerenciamento de Lotes CNH/PID

Sistema completo para gerenciamento de lotes de CNH e PID com banco de dados local SQLite e acesso via rede.

## 🚀 Características

- **Banco de dados local**: SQLite armazenado no seu PC
- **Acesso via rede**: Outros computadores podem acessar via IP da rede
- **Dados centralizados**: Todas as informações ficam no computador principal
- **Perfis de usuário**: Admin, CFC, Interno e Operador com permissões específicas
- **Upload de PDFs**: Processamento automático de lotes
- **Interface moderna**: Design elegante com cores pastéis

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- NPM ou Yarn

## 🛠️ Instalação

### 1. Instalar dependências do frontend
```bash
npm install
```

### 2. Instalar dependências do servidor
```bash
cd server
npm install
```

### 3. Iniciar o servidor (banco de dados)
```bash
cd server
npm start
```

O servidor será iniciado e mostrará os endereços de acesso:
- Local: http://localhost:3001
- Rede: http://[SEU-IP]:3001

### 4. Iniciar o frontend (em outro terminal)
```bash
npm run dev
```

## 🌐 Acesso via Rede

Para acessar de outros computadores na mesma rede:

1. **No computador principal** (onde está o banco):
   - Execute o servidor: `cd server && npm start`
   - Anote o IP mostrado (ex: http://192.168.1.100:3001)

2. **Nos outros computadores**:
   - Acesse o endereço IP do computador principal
   - Faça login normalmente

## 👥 Usuários Padrão

- **Admin**: `admin` / `admin123`
- **Admin**: `vini` / `328624`
  - Pode criar usuários, ver todos os lotes, gerenciar sistema

## 📁 Estrutura de Arquivos

```
/
├── src/                    # Frontend React
├── server/                 # Servidor Node.js + SQLite
│   ├── server.js          # Servidor principal
│   ├── database.js        # Configuração do banco
│   ├── cnh_system.db      # Banco SQLite (criado automaticamente)
│   └── uploads/           # Arquivos PDF enviados
└── README.md
```

## 🔧 Configuração

### Alterar porta do servidor
Edite o arquivo `server/server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Altere aqui
```

### Configurar IP do frontend
Edite o arquivo `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://SEU-IP:3001/api'; // Altere aqui
```

## 📊 Funcionalidades por Perfil

### Admin
- ✅ Criar/editar/excluir usuários
- ✅ Ver todos os lotes e CFCs
- ✅ Visualizar quem criou os lotes

### Operador
- ✅ Criar novos lotes (upload PDF)
- ✅ Alterar status dos lotes
- ✅ Usar área de separação
- ✅ Ver todos os lotes

### CFC
- ✅ Ver apenas lotes do próprio CFC
- ✅ Buscar por nome ou número
- ❌ Não vê quem criou os lotes
- ❌ Não pode alterar status

### Interno
- ✅ Ver todos os lotes e CFCs
- ✅ Buscar em todos os dados
- ❌ Não pode alterar nada

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Controle de acesso por perfil
- Validação de dados no servidor

## 🐛 Solução de Problemas

### Erro de conexão
- Verifique se o servidor está rodando
- Confirme o IP e porta corretos
- Verifique firewall/antivírus

### Banco não sincroniza
- Todos os dados ficam no computador principal
- Outros PCs apenas acessam via rede
- Não há sincronização - é centralizado

### Performance lenta
- Verifique a conexão de rede
- Considere usar cabo ethernet
- Feche aplicações desnecessárias

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor no terminal
2. Confirme se todos os serviços estão rodando
3. Teste primeiro localmente (localhost)