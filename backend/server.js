const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large project data

// --- Database & Folder Setup ---
const DATA_DIR = path.join(__dirname, 'data');

// 1. Users Database
const USERS_DIR = path.join(DATA_DIR, 'users');
const DB_FILE = path.join(USERS_DIR, 'database.json');

// 2. Files Data (Where projects.json will live)
const FILES_DATA_DIR = path.join(DATA_DIR, 'files');
const PROJECTS_FILE = path.join(FILES_DATA_DIR, 'projects.json');

// 3. Documents Uploads
const DOCUMENTS_DIR = path.join(DATA_DIR, 'documents');

// 4. General Uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });
if (!fs.existsSync(FILES_DATA_DIR)) fs.mkdirSync(FILES_DATA_DIR, { recursive: true });
if (!fs.existsSync(DOCUMENTS_DIR)) fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Initialize Users DB ---
if (!fs.existsSync(DB_FILE)) {
  const initialUsers = [
    {
      "id": "admin",
      "username": "admin",
      "password": "1234",
      "name": "Usuário Admin",
      "email": "admin@ajmonesystem.com",
      "role": "admin",
      "avatar": "🛡️"
    },
    {
      "id": "user",
      "username": "user",
      "password": "1234",
      "name": "Usuário Padrão",
      "email": "user@ajmonesystem.com",
      "role": "user",
      "avatar": "👤"
    }
  ];
  fs.writeFileSync(DB_FILE, JSON.stringify(initialUsers, null, 2));
}

// --- Initialize Projects DB ---
if (!fs.existsSync(PROJECTS_FILE)) {
  // Default Initial Data
  const initialProjects = [
    {
        id: '1',
        title: 'Lançamento Marketing Q4',
        icon: '🚀',
        updatedAt: new Date(),
        status: 'active',
        content: '# Plano de Lançamento de Marketing\n\nEste é o documento principal para o lançamento do Q4.\n\n- [ ] Definir público\n- [ ] Rascunhar cópia',
        cover: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
        coverPositionY: 50,
        kanbanData: [
          { 
            id: 'c1', 
            title: 'A Fazer', 
            color: '#EF4444',
            tasks: [
                { 
                    id: 't1', 
                    content: 'Rascunhar Emails', 
                    description: 'Rascunhar a sequência de 3 partes de email para o próximo lançamento de produto.', 
                    assignee: 'Sarah',
                    dueDate: '2023-11-20',
                    icon: '📧'
                }, 
                { id: 't2', content: 'Atualizar Redes Sociais', icon: '📱' }
            ] 
          },
          { id: 'c2', title: 'Em Progresso', color: '#3B82F6', tasks: [{ id: 't3', content: 'Design de Ativos', assignee: 'Mike', icon: '🎨' }] },
          { id: 'c3', title: 'Concluído', color: '#10B981', tasks: [] }
        ],
        ishikawaData: {
          effect: "Baixa Taxa de Conversão",
          categories: [
              { name: "Conteúdo", causes: ["Manchetes chatas", "CTA pouco clara"] },
              { name: "Tráfego", causes: ["Público errado", "Baixo volume"] }
          ]
        },
        scrumData: {
            backlog: [
                { id: 'b1', content: 'Como usuário, quero fazer login via Google', priority: 'High', storyPoints: 5 },
            ],
            sprints: [
                { id: 's1', title: 'Sprint 1', status: 'active', startDate: new Date().toISOString(), tasks: [
                    { id: 'st1', content: 'Configurar Pipeline CI/CD', priority: 'High', storyPoints: 3 }
                ]}
            ]
        }
      }
  ];
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(initialProjects, null, 2));
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (req.query.folder === 'documents') {
      cb(null, DOCUMENTS_DIR);
    } else {
      cb(null, UPLOADS_DIR);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

const upload = multer({ storage: storage });

// Serve Static Files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/documents', express.static(DOCUMENTS_DIR));


// --- Helper Functions ---
const readJSON = (filePath) => {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// --- API Routes ---

// 1. Uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const isDoc = req.query.folder === 'documents';
  const baseUrl = isDoc ? '/documents' : '/uploads';
  const fileUrl = `${req.protocol}://${req.get('host')}${baseUrl}/${req.file.filename}`;
  
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype
  });
});

// 2. Users CRUD
app.get('/api/users', (req, res) => {
  try {
    const users = readJSON(DB_FILE);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read users' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const newUser = req.body;
    const users = readJSON(DB_FILE);
    if (users.find(u => u.username === newUser.username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    users.push(newUser);
    writeJSON(DB_FILE, users);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const users = readJSON(DB_FILE);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users[index] = { ...users[index], ...updates };
    writeJSON(DB_FILE, users);
    res.json(users[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    let users = readJSON(DB_FILE);
    if (id === 'admin') return res.status(403).json({ error: 'Cannot delete root admin' });
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length === initialLength) return res.status(404).json({ error: 'User not found' });
    writeJSON(DB_FILE, users);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 3. Projects CRUD (Persistence)
app.get('/api/projects', (req, res) => {
    try {
        const projects = readJSON(PROJECTS_FILE);
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load projects' });
    }
});

app.post('/api/projects', (req, res) => {
    try {
        const projects = req.body;
        writeJSON(PROJECTS_FILE, projects);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save projects' });
    }
});

app.listen(PORT, () => {
  console.log(`AJM OneSystem Backend running on http://localhost:${PORT}`);
});
