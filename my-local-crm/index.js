const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to handle JSON data
app.use(express.json());

// 1. SERVE YOUR WEBSITE FILES (from the 'public' folder)
app.use(express.static('public'));

// Database File Path
const DB_FILE = path.join(__dirname, 'leads.json');

// Helper: Read Data
function getLeads() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return []; // Return empty if file error
    }
}

// Helper: Save Data
function saveLeads(leads) {
    fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2));
}

// --- API ROUTES (Replacing Firebase) ---

// GET: Fetch all leads
app.get('/api/leads', (req, res) => {
    const leads = getLeads();
    res.json(leads);
});

// POST: Add a new lead (or update existing)
app.post('/api/leads', (req, res) => {
    const newLead = req.body;
    const leads = getLeads();
    
    if (newLead.id) {
        // Update existing lead
        const index = leads.findIndex(l => l.id === newLead.id);
        if (index !== -1) {
            leads[index] = { ...leads[index], ...newLead };
        } else {
            leads.push(newLead);
        }
    } else {
        // Create new lead
        newLead.id = Date.now().toString(); // Generate simple ID
        newLead.createdAt = new Date().toISOString();
        leads.push(newLead);
    }

    saveLeads(leads);
    res.json({ success: true, lead: newLead });
});

// START SERVER
app.listen(port, () => {
    console.log(`CRM running at http://localhost:${port}/crm.html`);
});