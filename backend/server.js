const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

// Ensure DB exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

// Helper to read/write
const readUsers = () => {
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
};

const writeUsers = (users) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

// Routes

// GET /api/users - Retrieve all users
app.get('/api/users', (req, res) => {
  try {
    const users = readUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  try {
    const newUser = req.body;
    const users = readUsers();
    
    // Simple validation
    if (users.find(u => u.username === newUser.username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    users.push(newUser);
    writeUsers(users);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// PUT /api/users/:id - Update a user
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const users = readUsers();
    
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Merge updates
    users[index] = { ...users[index], ...updates };
    writeUsers(users);
    res.json(users[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete a user
app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    let users = readUsers();
    
    // Prevent deleting root admin if checking logic was server-side, 
    // but we handle this on frontend too.
    if (id === 'admin') {
         return res.status(403).json({ error: 'Cannot delete root admin' });
    }

    const initialLength = users.length;
    users = users.filter(u => u.id !== id);

    if (users.length === initialLength) {
      return res.status(404).json({ error: 'User not found' });
    }

    writeUsers(users);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.listen(PORT, () => {
  console.log(`AJM OneSystem Backend running on http://localhost:${PORT}`);
});