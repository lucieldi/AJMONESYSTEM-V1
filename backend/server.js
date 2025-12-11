
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

// --- Middlewares ---
app.use(cors()); // Permite CORS (útil para dev onde as portas são diferentes)
app.use(express.json({ limit: '50mb' }));

// ==========================================
// 1. CONFIGURAÇÃO DE DIRETÓRIOS E BANCO DE DADOS
// ==========================================

const STORAGE_DIR = path.join(__dirname, 'storage');
const SYSTEM_DB_DIR = path.join(STORAGE_DIR, 'system_db');
const USER_DATA_DIR = path.join(STORAGE_DIR, 'user_data');
const GLOBAL_UPLOADS = path.join(STORAGE_DIR, 'uploads');
const GLOBAL_DOCS = path.join(STORAGE_DIR, 'documents');

const USERS_DB_FILE = path.join(SYSTEM_DB_DIR, 'users.json');
const PROJECTS_DB_FILE = path.join(SYSTEM_DB_DIR, 'projects.json');
const MESSAGES_DB_FILE = path.join(SYSTEM_DB_DIR, 'messages.json');

// Inicialização da Infraestrutura
(function initializeSystem() {
    console.log("--- 🏗️  Inicializando Infraestrutura do Servidor ---");
    [STORAGE_DIR, SYSTEM_DB_DIR, USER_DATA_DIR, GLOBAL_UPLOADS, GLOBAL_DOCS].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    if (!fs.existsSync(USERS_DB_FILE)) {
        const initialUsers = [{ id: "admin", username: "admin", password: "1234", name: "Administrador", email: "admin@sistema.com", role: "admin", avatar: "🛡️" }];
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(initialUsers, null, 2));
        createUserFolderStructure(initialUsers[0]);
    }
    if (!fs.existsSync(PROJECTS_DB_FILE)) fs.writeFileSync(PROJECTS_DB_FILE, JSON.stringify([], null, 2));
    if (!fs.existsSync(MESSAGES_DB_FILE)) fs.writeFileSync(MESSAGES_DB_FILE, JSON.stringify([], null, 2));
})();

function createUserFolderStructure(user) {
    try {
        const safeFolderName = (user.id || user.username).replace(/[^a-z0-9_\-]/gi, '_');
        const userPath = path.join(USER_DATA_DIR, safeFolderName);
        if (!fs.existsSync(userPath)) {
            fs.mkdirSync(userPath, { recursive: true });
            fs.mkdirSync(path.join(userPath, 'private_files'));
            fs.writeFileSync(path.join(userPath, 'profile_data.json'), JSON.stringify({ ...user, createdAt: new Date().toISOString(), serverPath: userPath }, null, 2));
        }
    } catch (e) { console.error("Erro ao criar pasta user:", e); }
}

// ==========================================
// 2. UPLOAD
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, req.query.folder === 'documents' ? GLOBAL_DOCS : GLOBAL_UPLOADS);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedOriginal);
    }
});
const upload = multer({ storage: storage });

// Servir arquivos estáticos de upload
app.use('/uploads', express.static(GLOBAL_UPLOADS));
app.use('/documents', express.static(GLOBAL_DOCS));

// ==========================================
// 3. API ROUTES
// ==========================================
const readJSON = (path) => { try { return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : []; } catch { return []; } };
const writeJSON = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

app.get('/api/health', (req, res) => res.json({ status: 'online' }));

// Users
app.get('/api/users', (req, res) => res.json(readJSON(USERS_DB_FILE)));
app.post('/api/users', (req, res) => {
    const users = readJSON(USERS_DB_FILE);
    const newUser = req.body;
    if (users.find(u => u.username === newUser.username)) return res.status(400).json({ error: 'Usuário já existe' });
    if (!newUser.id) newUser.id = newUser.username + '_' + Date.now();
    users.push(newUser);
    writeJSON(USERS_DB_FILE, users);
    createUserFolderStructure(newUser);
    res.status(201).json(newUser);
});
app.put('/api/users/:id', (req, res) => {
    const users = readJSON(USERS_DB_FILE);
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    users[index] = { ...users[index], ...req.body };
    writeJSON(USERS_DB_FILE, users);
    res.json(users[index]);
});
app.delete('/api/users/:id', (req, res) => {
    const users = readJSON(USERS_DB_FILE);
    const newUsers = users.filter(u => u.id !== req.params.id);
    writeJSON(USERS_DB_FILE, newUsers);
    res.json({ success: true });
});

// Projects
app.get('/api/projects', (req, res) => res.json(readJSON(PROJECTS_DB_FILE)));
app.post('/api/projects', (req, res) => { writeJSON(PROJECTS_DB_FILE, req.body); res.json({ success: true }); });

// Chat
app.get('/api/messages', (req, res) => res.json(readJSON(MESSAGES_DB_FILE)));
app.post('/api/messages', (req, res) => {
    const msgs = readJSON(MESSAGES_DB_FILE);
    if (msgs.length > 5000) msgs.shift();
    msgs.push(req.body);
    writeJSON(MESSAGES_DB_FILE, msgs);
    res.json({ success: true });
});
app.delete('/api/messages', (req, res) => { writeJSON(MESSAGES_DB_FILE, []); res.json({ success: true }); });

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const isDoc = req.query.folder === 'documents';
    const fullUrl = `${req.protocol}://${req.get('host')}${isDoc ? '/documents' : '/uploads'}/${req.file.filename}`;
    res.json({ url: fullUrl, filename: req.file.filename, originalName: req.file.originalname, mimetype: req.file.mimetype, type: isDoc ? 'file' : 'image' });
});

app.post('/api/recover', (req, res) => { console.log(`[RECOVERY] ${req.body.email}`); res.json({ success: true }); });

// ==========================================
// 4. SERVIR FRONTEND (PRODUÇÃO)
// ==========================================
// Serve a pasta 'dist' gerada pelo 'npm run build' na raiz do projeto
const DIST_DIR = path.join(__dirname, '../dist');

if (fs.existsSync(DIST_DIR)) {
    console.log(`[STATIC] Servindo frontend a partir de: ${DIST_DIR}`);
    app.use(express.static(DIST_DIR));
    
    // Qualquer rota não-API retorna o index.html (SPA fallback)
    app.get('*', (req, res) => {
        // Verifica se não é uma rota de API ou de arquivo estático do backend
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/documents')) {
            res.sendFile(path.join(DIST_DIR, 'index.html'));
        }
    });
} else {
    console.log("[INFO] Pasta '../dist' não encontrada. Rode 'npm run build' na raiz para gerar o frontend.");
}

app.listen(PORT, () => {
    console.log(`\n🚀 Backend AJM OneSystem rodando em http://localhost:${PORT}`);
    if (fs.existsSync(DIST_DIR)) {
        console.log(`📱 Frontend disponível em http://localhost:${PORT}`);
    }
});