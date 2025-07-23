# 🚀 Guia Completo de Instalação - Sistema CNH/PID

## 📋 Pré-requisitos (O que você precisa instalar primeiro)

### 1. Instalar Node.js
1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador e siga as instruções
4. Para verificar se instalou corretamente, abra o **Prompt de Comando** e digite:
   ```
   node --version
   npm --version
   ```
   Deve aparecer os números das versões.

### 2. Baixar o Sistema
1. Baixe todos os arquivos do sistema para uma pasta no seu computador
2. Exemplo: `C:\sistema-cnh-pid\`

## 🛠️ Instalação Passo a Passo

### Passo 1: Abrir o Terminal/Prompt
1. **Windows**: Pressione `Windows + R`, digite `cmd` e pressione Enter
2. **Ou**: Clique com botão direito na pasta do sistema e escolha "Abrir no Terminal"

### Passo 2: Navegar até a pasta do sistema
```bash
cd C:\sistema-cnh-pid
```
*(Substitua pelo caminho onde você salvou os arquivos)*

### Passo 3: Instalar dependências do frontend
```bash
npm install
```
*Aguarde alguns minutos para baixar todas as dependências*

### Passo 4: Instalar dependências do servidor
```bash
cd server
npm install
```
*Aguarde alguns minutos novamente*

### Passo 5: Voltar para a pasta principal
```bash
cd ..
```

## ▶️ Como Iniciar o Sistema

### 1. Iniciar o Servidor (Banco de Dados)
Abra um **primeiro terminal** e execute:
```bash
cd C:\sistema-cnh-pid
npm run server
```

**Você verá algo assim:**
```
🚀 Servidor iniciado com sucesso!
📍 Porta: 3001

🌐 Acesse o sistema pelos seguintes endereços:
   Local: http://localhost:3001
   Rede: http://192.168.1.100:3001

💾 Banco de dados SQLite criado em: server/cnh_system.db
```

**⚠️ IMPORTANTE**: Anote o endereço "Rede" - outros computadores usarão este IP!

### 2. Iniciar o Frontend (Interface)
Abra um **segundo terminal** e execute:
```bash
cd C:\sistema-cnh-pid
npm run dev
```

**Você verá:**
```
Local:   http://localhost:5173/
Network: http://192.168.1.100:5173/
```

## 🌐 Acessar de Outros Computadores

### No Computador Principal (onde está o banco):
- Acesse: `http://localhost:5173`

### Em Outros Computadores da Rede:
- Acesse: `http://192.168.1.100:5173` *(use o IP que apareceu no seu terminal)*

## 👤 Primeiro Acesso

**Usuário padrão:**
- **Login**: `admin`
- **Senha**: `admin123`

## 📁 Estrutura de Arquivos Criados

Após a instalação, você terá:
```
sistema-cnh-pid/
├── server/
│   ├── cnh_system.db      ← Seu banco de dados (IMPORTANTE!)
│   ├── uploads/           ← PDFs enviados
│   └── ...
├── src/                   ← Código do frontend
└── ...
```

## 🔧 Solução de Problemas

### Erro: "node não é reconhecido"
- **Solução**: Instale o Node.js corretamente e reinicie o computador

### Erro: "npm install falhou"
- **Solução**: Execute como administrador ou verifique sua conexão com internet

### Erro: "Porta já está em uso"
- **Solução**: Feche outros programas que possam estar usando as portas 3001 ou 5173

### Outros computadores não conseguem acessar
- **Solução**: 
  1. Verifique se o firewall/antivírus não está bloqueando
  2. Confirme se todos estão na mesma rede Wi-Fi
  3. Use o IP correto mostrado no terminal

## 💾 Backup dos Dados

Para fazer backup dos seus dados:
1. Copie o arquivo `server/cnh_system.db`
2. Guarde em local seguro
3. Para restaurar, substitua o arquivo

## 🔄 Uso Diário

### Para usar o sistema todos os dias:

1. **Ligue o computador principal**
2. **Abra dois terminais**
3. **Terminal 1** - Inicie o servidor:
   ```bash
   cd C:\sistema-cnh-pid
   npm run server
   ```
4. **Terminal 2** - Inicie o frontend:
   ```bash
   cd C:\sistema-cnh-pid
   npm run dev
   ```
5. **Acesse no navegador**: `http://localhost:5173`

### Outros computadores:
- Apenas acessem: `http://SEU-IP:5173`

## 📞 Dicas Importantes

- ✅ **Sempre mantenha o servidor rodando** no computador principal
- ✅ **Faça backup** do arquivo `cnh_system.db` regularmente
- ✅ **Use cabo ethernet** para melhor performance
- ✅ **Mantenha o computador principal ligado** quando outros precisarem acessar
- ❌ **Não feche os terminais** enquanto estiver usando o sistema
- ❌ **Não delete** a pasta `server/` - contém seus dados!

## 🆘 Precisa de Ajuda?

Se algo não funcionar:
1. Verifique se seguiu todos os passos
2. Confirme se o Node.js está instalado
3. Verifique se não há erros nos terminais
4. Teste primeiro no computador principal antes de tentar acessar de outros PCs