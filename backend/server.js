
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

// --- Middlewares ---
app.use(cors()); // Permite que o frontend (porta diferente) acesse o backend
app.use(express.json({ limit: '50mb' })); // Limite aumentado para dados grandes

// ==========================================
// 1. CONFIGURAÇÃO DO BANCO DE DADOS E ARQUIVOS
// ==========================================

// Pasta Raiz de Armazenamento
const STORAGE_DIR = path.join(__dirname, 'storage');

// Estrutura Geral
const SYSTEM_DB_DIR = path.join(STORAGE_DIR, 'system_db');    // Banco de Dados do Sistema (JSONs)
const USER_DATA_DIR = path.join(STORAGE_DIR, 'user_data');    // Pastas individuais dos usuários
const GLOBAL_UPLOADS = path.join(STORAGE_DIR, 'uploads');     // Uploads públicos/gerais
const GLOBAL_DOCS = path.join(STORAGE_DIR, 'documents');      // Documentos públicos

// Arquivos de "Banco de Dados" (JSON)
const USERS_DB_FILE = path.join(SYSTEM_DB_DIR, 'users.json');
const PROJECTS_DB_FILE = path.join(SYSTEM_DB_DIR, 'projects.json');
const MESSAGES_DB_FILE = path.join(SYSTEM_DB_DIR, 'messages.json'); // NOVO: Chat

// --- Função de Inicialização (Cria a infraestrutura do servidor) ---
(function initializeSystem() {
    console.log("--- 🏗️  Inicializando Infraestrutura do Servidor ---");

    // 1. Criar Pastas Principais
    const folders = [STORAGE_DIR, SYSTEM_DB_DIR, USER_DATA_DIR, GLOBAL_UPLOADS, GLOBAL_DOCS];
    folders.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[CRIADO] Diretório: ${dir}`);
        }
    });

    // 2. Criar Banco de Dados de Usuários (Se não existir)
    if (!fs.existsSync(USERS_DB_FILE)) {
        const initialUsers = [
            { id: "admin", username: "admin", password: "1234", name: "Administrador", email: "admin@sistema.com", role: "admin", avatar: "🛡️" }
        ];
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(initialUsers, null, 2));
        
        // Criar pasta para o admin padrão também
        createUserFolderStructure(initialUsers[0]);
        
        console.log("[DB] Tabela de usuários inicializada.");
    }

    // 3. Criar Banco de Projetos (Se não existir)
    if (!fs.existsSync(PROJECTS_DB_FILE)) {
        fs.writeFileSync(PROJECTS_DB_FILE, JSON.stringify([], null, 2));
        console.log("[DB] Tabela de projetos inicializada.");
    }

    // 4. Criar Banco de Mensagens (Se não existir)
    if (!fs.existsSync(MESSAGES_DB_FILE)) {
        fs.writeFileSync(MESSAGES_DB_FILE, JSON.stringify([], null, 2));
        console.log("[DB] Tabela de chat inicializada.");
    }
})();

// --- Helper para criar pasta do usuário ---
function createUserFolderStructure(user) {
    try {
        // Sanitiza o ID/Username para ser um nome de pasta válido
        const safeFolderName = (user.id || user.username).replace(/[^a-z0-9_\-]/gi, '_');
        const userPath = path.join(USER_DATA_DIR, safeFolderName);

        if (!fs.existsSync(userPath)) {
            // 1. Cria a pasta raiz do usuário
            fs.mkdirSync(userPath, { recursive: true });
            
            // 2. Cria subpastas específicas
            fs.mkdirSync(path.join(userPath, 'private_files'));
            fs.mkdirSync(path.join(userPath, 'logs'));
            fs.mkdirSync(path.join(userPath, 'projects_backup'));

            // 3. Cria um arquivo JSON exclusivo com os dados cadastrais desse usuário
            const userProfilePath = path.join(userPath, 'profile_data.json');
            const profileData = {
                ...user,
                createdAt: new Date().toISOString(),
                serverPath: userPath,
                status: 'active'
            };
            fs.writeFileSync(userProfilePath, JSON.stringify(profileData, null, 2));

            console.log(`[USER] Pasta e dados criados para: ${user.username} em ${userPath}`);
        }
    } catch (error) {
        console.error(`[ERRO] Falha ao criar pasta para usuário ${user.username}:`, error);
    }
}

// ==========================================
// 2. CONFIGURAÇÃO DE UPLOAD (Multer)
// ==========================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (req.query.folder === 'documents') {
            cb(null, GLOBAL_DOCS);
        } else {
            cb(null, GLOBAL_UPLOADS);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedOriginal);
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(GLOBAL_UPLOADS));
app.use('/documents', express.static(GLOBAL_DOCS));

// ==========================================
// 3. ROTAS DA API
// ==========================================

const readJSON = (path) => {
    try {
        if (!fs.existsSync(path)) return [];
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (e) { return []; }
};

const writeJSON = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

app.get('/api/health', (req, res) => res.json({ status: 'online' }));

// --- USUÁRIOS (Cadastro com criação de pastas) ---
app.get('/api/users', (req, res) => {
    res.json(readJSON(USERS_DB_FILE));
});

app.post('/api/users', (req, res) => {
    const users = readJSON(USERS_DB_FILE);
    const newUser = req.body;

    // Validação simples
    if (users.find(u => u.username === newUser.username)) {
        return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    // Garante um ID se não vier
    if (!newUser.id) {
        newUser.id = newUser.username + '_' + Date.now();
    }
    
    // 1. Salva no "Banco de Dados" geral
    users.push(newUser);
    writeJSON(USERS_DB_FILE, users);

    // 2. CRIAÇÃO AUTOMÁTICA DA PASTA DO USUÁRIO NO SERVIDOR
    createUserFolderStructure(newUser);

    res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
    const users = readJSON(USERS_DB_FILE);
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
    
    users[index] = { ...users[index], ...req.body };
    writeJSON(USERS_DB_FILE, users);
    
    // Atualiza também o arquivo individual na pasta do usuário, se existir
    const safeFolderName = (users[index].id || users[index].username).replace(/[^a-z0-9_\-]/gi, '_');
    const userProfilePath = path.join(USER_DATA_DIR, safeFolderName, 'profile_data.json');
    if (fs.existsSync(userProfilePath)) {
        const currentData = JSON.parse(fs.readFileSync(userProfilePath, 'utf8'));
        const updatedData = { ...currentData, ...req.body, lastModified: new Date().toISOString() };
        fs.writeFileSync(userProfilePath, JSON.stringify(updatedData, null, 2));
    }

    res.json(users[index]);
});

app.delete('/api/users/:id', (req, res) => {
    const users = readJSON(USERS_DB_FILE);
    const userToDelete = users.find(u => u.id === req.params.id);
    
    // Remove do DB
    const newUsers = users.filter(u => u.id !== req.params.id);
    writeJSON(USERS_DB_FILE, newUsers);

    // Opcional: Renomear a pasta para 'deleted_usuario' ao invés de apagar, para segurança
    if (userToDelete) {
        const safeFolderName = (userToDelete.id || userToDelete.username).replace(/[^a-z0-9_\-]/gi, '_');
        const userPath = path.join(USER_DATA_DIR, safeFolderName);
        if (fs.existsSync(userPath)) {
            const deletedPath = path.join(USER_DATA_DIR, `DELETED_${Date.now()}_${safeFolderName}`);
            try {
                fs.renameSync(userPath, deletedPath);
                console.log(`[USER] Pasta do usuário arquivada: ${deletedPath}`);
            } catch (e) {
                console.error("Erro ao arquivar pasta do usuário", e);
            }
        }
    }

    res.json({ success: true });
});

// --- PROJETOS ---
app.get('/api/projects', (req, res) => {
    res.json(readJSON(PROJECTS_DB_FILE));
});

app.post('/api/projects', (req, res) => {
    writeJSON(PROJECTS_DB_FILE, req.body);
    res.json({ success: true });
});

// --- CHAT / MENSAGENS ---
app.get('/api/messages', (req, res) => {
    res.json(readJSON(MESSAGES_DB_FILE));
});

app.post('/api/messages', (req, res) => {
    const messages = readJSON(MESSAGES_DB_FILE);
    const newMessage = req.body;
    
    // Mantém histórico razoável (ex: últimas 5000 mensagens)
    if (messages.length > 5000) {
        messages.shift();
    }
    
    messages.push(newMessage);
    writeJSON(MESSAGES_DB_FILE, messages);
    res.json({ success: true });
});

app.delete('/api/messages', (req, res) => {
    writeJSON(MESSAGES_DB_FILE, []);
    res.json({ success: true });
});

// --- UPLOAD ---
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    
    const isDoc = req.query.folder === 'documents';
    const baseUrl = isDoc ? '/documents' : '/uploads';
    const fullUrl = `${req.protocol}://${req.get('host')}${baseUrl}/${req.file.filename}`;

    res.json({
        url: fullUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        type: isDoc ? 'file' : 'image'
    });
});

app.post('/api/recover', async (req, res) => {
    const { email } = req.body;
    console.log(`[EMAIL] Simulando envio de recuperação para: ${email}`);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Backend AJM OneSystem rodando em http://localhost:${PORT}`);
    console.log(`📂 Armazenamento Mestre: ${STORAGE_DIR}`);
    console.log(`👤 Diretório de Dados de Usuários: ${USER_DATA_DIR}`);
});