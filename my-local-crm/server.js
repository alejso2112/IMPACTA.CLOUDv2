const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// 1. SERVE HTML FILES FROM THE CURRENT DIRECTORY
app.use(express.static(__dirname)); 

// --- DATABASE FILES ---
const LEADS_FILE = path.join(__dirname, 'leads.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const ACTIVITIES_FILE = path.join(__dirname, 'activities.json');

// --- HELPERS ---
function readJSON(file) {
    try { 
        if (!fs.existsSync(file)) return []; 
        return JSON.parse(fs.readFileSync(file, 'utf8')); 
    } 
    catch (e) { return []; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- AUTO-SEED ADMIN ACCOUNT ---
// If users.json doesn't exist, this creates a master login for you automatically!
if (!fs.existsSync(USERS_FILE) || readJSON(USERS_FILE).length === 0) {
    const defaultAdmin = [{
        id: "1",
        name: "Admin",
        email: "admin@impacta.cloud",
        password: "password123",
        role: "admin",
        createdAt: new Date().toISOString()
    }];
    saveJSON(USERS_FILE, defaultAdmin);
    console.log("⚠️ Created default admin account: admin@impacta.cloud / password123");
}

// --- LOGIN API ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
        const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        res.json({ success: true, user: safeUser });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials. Check your email and password." });
    }
});

// --- USERS API ---
app.get('/api/users', (req, res) => {
    const users = readJSON(USERS_FILE);
    const safeUsers = users.map(u => ({ 
        id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt 
    }));
    res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
    const newUser = req.body;
    const users = readJSON(USERS_FILE);
    
    newUser.id = Date.now().toString();
    newUser.createdAt = new Date().toISOString();
    
    users.push(newUser);
    saveJSON(USERS_FILE, users);
    res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
    const updatedUser = req.body;
    const users = readJSON(USERS_FILE);
    const index = users.findIndex(u => u.id === req.params.id);

    if (index !== -1) {
        if (!updatedUser.password) {
            delete updatedUser.password;
        }
        users[index] = { ...users[index], ...updatedUser };
        saveJSON(USERS_FILE, users);
        res.json({ success: true, user: users[index] });
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    let users = readJSON(USERS_FILE);
    users = users.filter(u => u.id !== id);
    saveJSON(USERS_FILE, users);
    res.json({ success: true });
});

// --- LEADS API ---
app.get('/api/leads', (req, res) => {
    res.json(readJSON(LEADS_FILE));
});

app.post('/api/leads', (req, res) => {
    const newLead = req.body;
    const leads = readJSON(LEADS_FILE);
    
    if (!newLead.id) newLead.id = Date.now().toString();
    if (!newLead.createdAt) newLead.createdAt = new Date().toISOString();
    
    leads.push(newLead);
    saveJSON(LEADS_FILE, leads);
    res.json({ success: true, lead: newLead });
});

app.put('/api/leads/:id', (req, res) => {
    const updatedLead = req.body;
    const leads = readJSON(LEADS_FILE);
    const index = leads.findIndex(l => l.id === req.params.id);

    if (index !== -1) {
        leads[index] = { ...leads[index], ...updatedLead };
        saveJSON(LEADS_FILE, leads);
        res.json({ success: true, lead: leads[index] });
    } else {
        res.status(404).json({ success: false, message: "Lead not found" });
    }
});

app.delete('/api/leads/:id', (req, res) => {
    let leads = readJSON(LEADS_FILE);
    leads = leads.filter(l => l.id !== req.params.id);
    saveJSON(LEADS_FILE, leads);
    res.json({ success: true });
});

// --- ACTIVITIES API ---
app.post('/api/activities', (req, res) => {
    const newActivity = req.body;
    const activities = readJSON(ACTIVITIES_FILE);
    
    if (!newActivity.id) newActivity.id = Date.now().toString();
    if (!newActivity.createdAt) newActivity.createdAt = new Date().toISOString();
    
    activities.push(newActivity);
    saveJSON(ACTIVITIES_FILE, activities);
    res.json({ success: true, activity: newActivity });
});

app.get('/api/activities/:leadId', (req, res) => {
    const activities = readJSON(ACTIVITIES_FILE);
    const leadActivities = activities.filter(a => a.leadId === req.params.leadId);
    leadActivities.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(leadActivities);
});

app.get('/api/activities', (req, res) => {
    const activities = readJSON(ACTIVITIES_FILE);
    activities.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(activities);
});

// --- CLOUDFLARE SPEED FIX ---
app.listen(port, '127.0.0.1', () => {
    console.log(`CRM Backend running instantly on IPv4!`);
    console.log(`Access it here: http://127.0.0.1:${port}/index.html`);
});