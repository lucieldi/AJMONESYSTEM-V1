const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large project data

// --- 1. CENTRALIZED STORAGE DEFINITION ---
// This 'storage' folder will contain ALL data as requested
const STORAGE_DIR = path.join(__dirname, 'storage');

// Sub-directories
const USERS_DIR = path.join(STORAGE_DIR, 'users');
const PROJECTS_DIR = path.join(STORAGE_DIR, 'projects');
const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
const DOCUMENTS_DIR = path.join(STORAGE_DIR, 'documents');

// File Paths
const USERS_DB_FILE = path.join(USERS_DIR, 'database.json');
const PROJECTS_DB_FILE = path.join(PROJECTS_DIR, 'projects.json');

// --- 2. INITIALIZATION & MIGRATION SCRIPT ---
// This runs on startup to create folders and move existing files to the new location
(function initializeStorage() {
    console.log("--- Initializing Storage System ---");

    // A. Create the new folder structure if it doesn't exist
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);
    if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });
    if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(DOCUMENTS_DIR)) fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });

    // B. MIGRATION LOGIC: Move files from old locations to new 'storage' folder
    
    // 1. Migrate Users
    const oldUsersPath = path.join(__dirname, 'data', 'users', 'database.json');
    if (fs.existsSync(oldUsersPath) && !fs.existsSync(USERS_DB_FILE)) {
        console.log("Migrating Users DB...");
        fs.copyFileSync(oldUsersPath, USERS_DB_FILE);
    }

    // 2. Migrate Projects
    const oldProjectsPath = path.join(__dirname, 'data', 'files', 'projects.json');
    if (fs.existsSync(oldProjectsPath) && !fs.existsSync(PROJECTS_DB_FILE)) {
        console.log("Migrating Projects DB...");
        fs.copyFileSync(oldProjectsPath, PROJECTS_DB_FILE);
    }

    // 3. Migrate Generic Uploads (Root uploads folder)
    const oldUploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(oldUploadsDir)) {
        const files = fs.readdirSync(oldUploadsDir);
        files.forEach(file => {
            const src = path.join(oldUploadsDir, file);
            const dest = path.join(UPLOADS_DIR, file);
            if (fs.lstatSync(src).isFile() && !fs.existsSync(dest)) {
                fs.copyFileSync(src, dest);
            }
        });
        console.log(`Migrated ${files.length} uploads.`);
    }

    // 4. Migrate Documents (Old data/documents folder)
    const oldDocsDir = path.join(__dirname, 'data', 'documents');
    if (fs.existsSync(oldDocsDir)) {
        const files = fs.readdirSync(oldDocsDir);
        files.forEach(file => {
            const src = path.join(oldDocsDir, file);
            const dest = path.join(DOCUMENTS_DIR, file);
            if (fs.lstatSync(src).isFile() && !fs.existsSync(dest)) {
                fs.copyFileSync(src, dest);
            }
        });
        console.log(`Migrated ${files.length} documents.`);
    }

    // C. SEED DEFAULT DATA (If files still don't exist after migration)
    
    // Seed Users
    if (!fs.existsSync(USERS_DB_FILE)) {
        const initialUsers = [
            { id: "admin", username: "admin", password: "1234", name: "Usuário Admin", email: "admin@ajmonesystem.com", role: "admin", avatar: "🛡️" },
            { id: "user", username: "user", password: "1234", name: "Usuário Padrão", email: "user@ajmonesystem.com", role: "user", avatar: "👤" }
        ];
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(initialUsers, null, 2));
        console.log("Created default Users DB.");
    }

    // Seed Projects
    if (!fs.existsSync(PROJECTS_DB_FILE)) {
        const initialProjects = [{
            id: '1', title: 'Projeto Exemplo', icon: '🚀', updatedAt: new Date(), status: 'active',
            content: '# Bem-vindo\nEste é um projeto inicial.',
            cover: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)', coverPositionY: 50,
            kanbanData: [
                { id: 'todo', title: 'A Fazer', color: '#EF4444', tasks: [{ id: 't1', content: 'Primeira Tarefa' }] },
                { id: 'done', title: 'Concluído', color: '#10B981', tasks: [] }
            ],
            ishikawaData: { effect: "Problema Exemplo", categories: [] },
            scrumData: { backlog: [], sprints: [] }
        }];
        fs.writeFileSync(PROJECTS_DB_FILE, JSON.stringify(initialProjects, null, 2));
        console.log("Created default Projects DB.");
    }

    console.log("--- Storage System Ready at /backend/storage ---");
})();

// --- Helper Functions ---
const readJSON = (filePath) => {
  try {
      if(!fs.existsSync(filePath)) return [];
      const data = fs.readFileSync(filePath);
      return JSON.parse(data);
  } catch (e) {
      console.error("Error reading JSON:", filePath, e);
      return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Configure Multer Storage (Points to the new locations)
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

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    jsonTransport: true // Logs email to console for demo purposes
});

// Serve Static Files from the new centralized location
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/documents', express.static(DOCUMENTS_DIR));


// --- API ROUTES ---

// 1. Uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
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

// 2. Users
app.get('/api/users', (req, res) => {
  res.json(readJSON(USERS_DB_FILE));
});

app.post('/api/users', (req, res) => {
  try {
    const newUser = req.body;
    const users = readJSON(USERS_DB_FILE);
    if (users.find(u => u.username === newUser.username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    users.push(newUser);
    writeJSON(USERS_DB_FILE, users);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const users = readJSON(USERS_DB_FILE);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users[index] = { ...users[index], ...updates };
    writeJSON(USERS_DB_FILE, users);
    res.json(users[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    let users = readJSON(USERS_DB_FILE);
    if (id === 'admin') return res.status(403).json({ error: 'Cannot delete root admin' });
    const initialLength = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length === initialLength) return res.status(404).json({ error: 'User not found' });
    writeJSON(USERS_DB_FILE, users);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 3. Password Recovery
app.post('/api/recover', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const users = readJSON(USERS_DB_FILE);
        const user = users.find(u => u.email === email || u.username === email);

        if (!user || !user.email) {
             console.log(`Recovery requested for ${email} but user not found.`);
             return res.json({ success: true, message: 'If account exists, email sent.' });
        }

        const mailOptions = {
            from: '"AJM System" <no-reply@ajmonesystem.com>',
            to: user.email,
            subject: 'Redefinição de Senha - AJM OneSystem',
            html: `<div style="font-family: sans-serif; padding: 20px;">
                     <h2>Olá ${user.name},</h2>
                     <p>Sua senha atual é: <strong>${user.password}</strong></p>
                   </div>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("--- EMAIL SENT SIMULATION ---", info.message);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// 4. Projects
app.get('/api/projects', (req, res) => {
    res.json(readJSON(PROJECTS_DB_FILE));
});

app.post('/api/projects', (req, res) => {
    try {
        writeJSON(PROJECTS_DB_FILE, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save projects' });
    }
});

app.listen(PORT, () => {
  console.log(`AJM OneSystem Backend running on http://localhost:${PORT}`);
  console.log(`Storage Location: ${STORAGE_DIR}`);
});