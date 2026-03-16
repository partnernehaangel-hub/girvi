import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global error handling for server
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let db: any;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    aadhaar TEXT,
    aadhaar_proof TEXT,
    pan TEXT,
    pan_proof TEXT,
    photo TEXT,
    signature TEXT,
    nominee TEXT,
    nominee_proof TEXT,
    attachments TEXT, -- JSON array of extra proofs
    status TEXT DEFAULT 'active', -- active, blacklisted
    username TEXT,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    loan_number TEXT UNIQUE,
    amount REAL NOT NULL,
    disbursement_mode TEXT,
    interest_rate REAL,
    interest_type TEXT,
    compounding TEXT,
    cycle TEXT,
    start_date DATE,
    maturity_date DATE,
    penalty_rate REAL,
    status TEXT DEFAULT 'active',
    closure_requested INTEGER DEFAULT 0, -- 0: no, 1: requested
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    type TEXT,
    purity TEXT,
    gross_weight REAL,
    net_weight REAL,
    wastage REAL,
    market_rate REAL,
    valuation REAL,
    packet_number TEXT,
    locker_location TEXT,
    photos TEXT,
    status TEXT DEFAULT 'pledged',
    FOREIGN KEY(loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    date DATE,
    amount REAL,
    mode TEXT,
    type TEXT, -- principal, interest, penalty
    balance REAL,
    transaction_id TEXT UNIQUE,
    remarks TEXT,
    FOREIGN KEY(loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    customer_id INTEGER,
    title TEXT NOT NULL,
    type TEXT,
    source TEXT,
    file_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(loan_id) REFERENCES loans(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS lockers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    total_boxes INTEGER DEFAULT 12,
    status TEXT DEFAULT 'secure',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    locker_id INTEGER,
    box_number INTEGER NOT NULL,
    packet_id TEXT,
    loan_id INTEGER,
    customer_id INTEGER,
    status TEXT DEFAULT 'empty', -- empty, occupied
    FOREIGN KEY(locker_id) REFERENCES lockers(id),
    FOREIGN KEY(loan_id) REFERENCES loans(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    user_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS top_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(loan_id) REFERENCES loans(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`;

async function startServer() {
  try {
    console.log("Initializing database...");
    try {
      db = new Database("girvi.db");
    } catch (err) {
      console.error("Failed to open girvi.db, falling back to memory:", err);
      db = new Database(":memory:");
    }

    // Initialize Database Schema
    db.exec(SCHEMA);

    // Seed Indian Customers if empty
    db.exec(`
      INSERT INTO customers (name, mobile, address, status, username, password) 
      SELECT 'Rajesh Kumar', '9876543210', 'Mumbai, Maharashtra', 'active', 'rajesh', 'pass123'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Rajesh Kumar');
      
      INSERT INTO customers (name, mobile, address, status, username, password) 
      SELECT 'Priya Sharma', '9123456789', 'Delhi, NCR', 'active', 'priya', 'pass123'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Priya Sharma');

      INSERT INTO customers (name, mobile, address, status, username, password) 
      SELECT 'Amit Patel', '9988776655', 'Ahmedabad, Gujarat', 'blacklisted', 'amit', 'pass123'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Amit Patel');

      INSERT INTO customers (name, mobile, address, status, username, password) 
      SELECT 'Sneha Reddy', '9000011111', 'Hyderabad, Telangana', 'active', 'sneha', 'pass123'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Sneha Reddy');

      INSERT INTO customers (name, mobile, address, status, username, password) 
      SELECT 'Vikram Singh', '9822001122', 'Jaipur, Rajasthan', 'active', 'vikram', 'pass123'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Vikram Singh');

      INSERT INTO customers (name, mobile, address, status, username, password) 
      SELECT 'Ananya Iyer', '9744556677', 'Chennai, Tamil Nadu', 'active', 'ananya', 'pass123'
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Ananya Iyer');

      -- Seed initial lockers if empty
      INSERT INTO lockers (number, total_boxes) 
      SELECT 'L-001', 12 WHERE NOT EXISTS (SELECT 1 FROM lockers WHERE number = 'L-001');
      INSERT INTO lockers (number, total_boxes) 
      SELECT 'L-002', 12 WHERE NOT EXISTS (SELECT 1 FROM lockers WHERE number = 'L-002');
      INSERT INTO lockers (number, total_boxes) 
      SELECT 'L-003', 24 WHERE NOT EXISTS (SELECT 1 FROM lockers WHERE number = 'L-003');

      -- Seed sample loans if empty
      INSERT INTO loans (customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, start_date, maturity_date, status)
      SELECT 1, 'LN-1001', 50000, 'Cash', 1.5, 'simple', date('now', '-2 months'), date('now', '+10 months'), 'active'
      WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LN-1001');

      INSERT INTO loans (customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, start_date, maturity_date, status)
      SELECT 2, 'LN-1002', 120000, 'Bank Transfer', 1.2, 'compounded', date('now', '-1 month'), date('now', '+11 months'), 'active'
      WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LN-1002');

      INSERT INTO loans (customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, start_date, maturity_date, status)
      SELECT 4, 'LN-1003', 25000, 'UPI', 2.0, 'simple', date('now', '-15 days'), date('now', '+5 months'), 'active'
      WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LN-1003');

      INSERT INTO loans (customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, start_date, maturity_date, status)
      SELECT 5, 'LN-1004', 75000, 'Cash', 1.8, 'simple', date('now', '-10 days'), date('now', '+6 months'), 'active'
      WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LN-1004');

      INSERT INTO loans (customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, start_date, maturity_date, status)
      SELECT 6, 'LN-1005', 200000, 'Bank Transfer', 1.0, 'compounded', date('now', '-5 days'), date('now', '+12 months'), 'active'
      WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LN-1005');

      -- Seed items for loans
      INSERT INTO items (loan_id, type, purity, gross_weight, net_weight, market_rate, valuation, packet_number, locker_location)
      SELECT 1, 'Gold Chain', '22K', 12.5, 12.0, 6500, 78000, 'PKT-A1', 'L-001/B1'
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE loan_id = 1);

      INSERT INTO items (loan_id, type, purity, gross_weight, net_weight, market_rate, valuation, packet_number, locker_location)
      SELECT 2, 'Gold Bangles', '22K', 35.0, 34.2, 6500, 222300, 'PKT-A2', 'L-001/B2'
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE loan_id = 2);

      INSERT INTO items (loan_id, type, purity, gross_weight, net_weight, market_rate, valuation, packet_number, locker_location)
      SELECT 4, 'Silver Ornaments', '925', 500.0, 480.0, 75, 36000, 'PKT-B1', 'L-002/B1'
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE loan_id = 4);

      INSERT INTO items (loan_id, type, purity, gross_weight, net_weight, market_rate, valuation, packet_number, locker_location)
      SELECT 5, 'Diamond Ring', '18K', 5.2, 4.8, 150000, 350000, 'PKT-B2', 'L-002/B2'
      WHERE NOT EXISTS (SELECT 1 FROM items WHERE loan_id = 5);

      -- Seed some payments
      INSERT INTO payments (loan_id, date, amount, mode, type, transaction_id, remarks)
      SELECT 1, date('now', '-1 month'), 750, 'Cash', 'interest', 'TXN-001', 'First month interest'
      WHERE NOT EXISTS (SELECT 1 FROM payments WHERE transaction_id = 'TXN-001');

      INSERT INTO payments (loan_id, date, amount, mode, type, transaction_id, remarks)
      SELECT 2, date('now', '-5 days'), 1440, 'UPI', 'interest', 'TXN-002', 'Interest payment'
      WHERE NOT EXISTS (SELECT 1 FROM payments WHERE transaction_id = 'TXN-002');
    `);

    // Check for missing columns (Migrations)
    const tableInfo = db.prepare("PRAGMA table_info(loans)").all();
    if (tableInfo.length > 0) {
      const hasUpdatedAt = tableInfo.some((col: any) => col.name === 'updated_at');
      if (!hasUpdatedAt) {
        console.log("Adding updated_at column to loans table...");
        db.exec("ALTER TABLE loans ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
      }
    }

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed critically:", err);
    // Last resort fallback
    if (!db) db = new Database(":memory:");
  }

  console.log("Starting Express server...");
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === '12345') {
      return res.json({ role: 'admin', user: { id: 0, name: 'Administrator' } });
    }

    const customer = db.prepare("SELECT * FROM customers WHERE username = ? AND password = ?").get(username, password);
    if (customer) {
      return res.json({ role: 'customer', user: customer });
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  // API Routes
  app.get("/api/dashboard/stats", (req, res) => {
    const activeLoans = db.prepare("SELECT COUNT(*) as count, SUM(amount) as total FROM loans WHERE status = 'active'").get();
    const releasedItems = db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'released'").get();
    const overdueLoans = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'active' AND maturity_date < date('now')").get();
    const upcomingMaturity = db.prepare(`
      SELECT l.*, c.name as customer_name 
      FROM loans l 
      JOIN customers c ON l.customer_id = c.id 
      WHERE l.status = 'active' 
      AND l.maturity_date >= date('now')
      ORDER BY l.maturity_date ASC 
      LIMIT 5
    `).all();
    
    res.json({
      activeLoans: activeLoans.count || 0,
      totalActiveAmount: activeLoans.total || 0,
      releasedItems: releasedItems.count || 0,
      overdueLoans: overdueLoans.count || 0,
      upcomingMaturity,
      dailyCollection: 0,
      monthlyEarnings: 0
    });
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
    res.json(customers);
  });

  app.post("/api/admin/customer-credentials", (req, res) => {
    const { customerId, username, password } = req.body;
    db.prepare("UPDATE customers SET username = ?, password = ? WHERE id = ?").run(username, password, customerId);
    res.json({ success: true });
  });

  app.post("/api/customers", (req, res) => {
    const { 
      name, mobile, address, aadhaar, aadhaar_proof, 
      pan, pan_proof, photo, signature, nominee, 
      nominee_proof, attachments, username, password
    } = req.body;
    
    const info = db.prepare(`
      INSERT INTO customers (
        name, mobile, address, aadhaar, aadhaar_proof, 
        pan, pan_proof, photo, signature, nominee, 
        nominee_proof, attachments, username, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, mobile, address, aadhaar, aadhaar_proof, 
      pan, pan_proof, photo, signature, nominee, 
      nominee_proof, JSON.stringify(attachments || []),
      username || null, password || null
    );
    res.json({ id: info.lastInsertRowid });
  });

  // Loans
  app.get("/api/loans", (req, res) => {
    const customerId = req.query.customerId;
    let query = `
      SELECT l.*, c.name as customer_name 
      FROM loans l 
      JOIN customers c ON l.customer_id = c.id 
    `;
    let params = [];
    if (customerId) {
      query += " WHERE l.customer_id = ?";
      params.push(customerId);
    }
    query += " ORDER BY l.created_at DESC";
    const loans = db.prepare(query).all(...params);
    res.json(loans);
  });

  app.post("/api/customer/loan-closure-request", (req, res) => {
    const { loanId } = req.body;
    db.prepare("UPDATE loans SET closure_requested = 1 WHERE id = ?").run(loanId);
    res.json({ success: true });
  });

  app.post("/api/admin/approve-closure", (req, res) => {
    const { loanId, approve } = req.body;
    if (approve) {
      db.prepare("UPDATE loans SET status = 'closed', closure_requested = 0 WHERE id = ?").run(loanId);
      // Also release items
      db.prepare("UPDATE items SET status = 'released' WHERE loan_id = ?").run(loanId);
    } else {
      db.prepare("UPDATE loans SET closure_requested = 0 WHERE id = ?").run(loanId);
    }
    res.json({ success: true });
  });

  app.get("/api/loans/:id", (req, res) => {
    const loan = db.prepare(`
      SELECT l.*, c.name as customer_name, c.mobile as customer_mobile
      FROM loans l 
      JOIN customers c ON l.customer_id = c.id 
      WHERE l.id = ? OR l.loan_number = ?
    `).get(req.params.id, req.params.id);
    
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    const items = db.prepare("SELECT * FROM items WHERE loan_id = ?").all(loan.id);
    const payments = db.prepare("SELECT * FROM payments WHERE loan_id = ? ORDER BY date ASC").all(loan.id);
    const top_ups = db.prepare("SELECT * FROM top_ups WHERE loan_id = ? ORDER BY date ASC").all(loan.id);
    
    res.json({ ...loan, items, payments, top_ups });
  });

  app.post("/api/loans/:id/top-up", (req, res) => {
    const { amount, date, remarks } = req.body;
    const loanId = req.params.id;

    try {
      const transaction = db.transaction(() => {
        // Record top up
        db.prepare("INSERT INTO top_ups (loan_id, amount, date, remarks) VALUES (?, ?, ?, ?)")
          .run(loanId, amount, date, remarks);

        // Update loan principal
        db.prepare("UPDATE loans SET amount = amount + ? WHERE id = ?")
          .run(amount, loanId);

        db.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)")
          .run('TOP_UP', 'loan', loanId, `Topped up loan by ₹${amount} on ${date}`);
      });

      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/loans", (req, res) => {
    try {
      const { customer_id, amount, disbursement_mode, interest_rate, interest_type, compounding, cycle, start_date, maturity_date, penalty_rate, items } = req.body;
      
      const loan_number = "LN-" + Date.now();
      
      const transaction = db.transaction(() => {
        const loanInfo = db.prepare(`
          INSERT INTO loans (customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, compounding, cycle, start_date, maturity_date, penalty_rate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(customer_id, loan_number, amount, disbursement_mode, interest_rate, interest_type, compounding, cycle, start_date, maturity_date, penalty_rate);
        
        const loanId = loanInfo.lastInsertRowid;
        
        const insertItem = db.prepare(`
          INSERT INTO items (loan_id, type, purity, gross_weight, net_weight, wastage, market_rate, valuation, packet_number, locker_location, photos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        if (items && Array.isArray(items)) {
          for (const item of items) {
            insertItem.run(loanId, item.type, item.purity, item.gross_weight, item.net_weight, item.wastage, item.market_rate, item.valuation, item.packet_number, item.locker_location, JSON.stringify(item.photos || []));
          }
        }
        
        db.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)")
          .run('CREATE_LOAN', 'loan', loanId, `Created loan ${loan_number} for customer ${customer_id}`);

        return loanId;
      });
      
      const loanId = transaction();
      res.json({ id: loanId, loan_number });
    } catch (error: any) {
      console.error("Loan creation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Payments
  app.get("/api/payments", (req, res) => {
    const customerId = req.query.customerId;
    const loanId = req.query.loanId;
    let query = `
      SELECT p.*, l.loan_number, c.name as customer_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
    `;
    let params = [];
    if (loanId) {
      query += " WHERE p.loan_id = ?";
      params.push(loanId);
    } else if (customerId) {
      query += " WHERE l.customer_id = ?";
      params.push(customerId);
    }
    query += " ORDER BY p.date DESC";
    const payments = db.prepare(query).all(...params);
    res.json(payments);
  });

  app.post("/api/payments", (req, res) => {
    const { loan_id, date, amount, mode, type, remarks, transaction_id } = req.body;
    const info = db.prepare("INSERT INTO payments (loan_id, date, amount, mode, type, remarks, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(loan_id, date, amount, mode, type, remarks, transaction_id);
    
    // If full settlement, close loan
    if (type === 'full_settlement') {
      db.prepare("UPDATE loans SET status = 'closed' WHERE id = ?").run(loan_id);
      db.prepare("UPDATE items SET status = 'released' WHERE loan_id = ?").run(loan_id);
    }
    
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/payments/check-transaction/:id", (req, res) => {
    const exists = db.prepare("SELECT 1 FROM payments WHERE transaction_id = ?").get(req.params.id);
    res.json({ exists: !!exists });
  });

  // Documents
  app.get("/api/documents", (req, res) => {
    const docs = db.prepare(`
      SELECT d.*, c.name as customer_name, l.loan_number 
      FROM documents d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN loans l ON d.loan_id = l.id
      ORDER BY d.created_at DESC
    `).all();
    res.json(docs);
  });

  app.post("/api/documents", (req, res) => {
    const { loan_id, customer_id, title, type, source, file_data } = req.body;
    const info = db.prepare(`
      INSERT INTO documents (loan_id, customer_id, title, type, source, file_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(loan_id, customer_id, title, type, source, file_data);
    res.json({ id: info.lastInsertRowid });
  });

  // Items
  app.get("/api/items", (req, res) => {
    const loanId = req.query.loanId;
    const customerId = req.query.customerId;
    let query = `
      SELECT i.*, c.name as customer_name, l.loan_number 
      FROM items i
      JOIN loans l ON i.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
    `;
    let params = [];
    if (loanId) {
      query += " WHERE i.loan_id = ?";
      params.push(loanId);
    } else if (customerId) {
      query += " WHERE l.customer_id = ?";
      params.push(customerId);
    }
    query += " ORDER BY i.id DESC";
    const items = db.prepare(query).all(...params);
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    const { loan_id, type, purity, gross_weight, net_weight, wastage, market_rate, valuation, packet_number, locker_location } = req.body;
    const info = db.prepare(`
      INSERT INTO items (loan_id, type, purity, gross_weight, net_weight, wastage, market_rate, valuation, packet_number, locker_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(loan_id, type, purity, gross_weight, net_weight, wastage, market_rate, valuation, packet_number, locker_location);
    
    db.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)")
      .run('ADD_ITEM', 'item', info.lastInsertRowid, `Added ${type} to Loan ${loan_id}`);

    res.json({ id: info.lastInsertRowid });
  });

  // Lockers & Boxes
  app.get("/api/lockers", (req, res) => {
    const lockers = db.prepare(`
      SELECT l.*, 
      (SELECT COUNT(*) FROM boxes b WHERE b.locker_id = l.id AND b.status = 'occupied') as occupied_count
      FROM lockers l
    `).all();
    res.json(lockers);
  });

  app.post("/api/lockers", (req, res) => {
    const { number, total_boxes } = req.body;
    
    // Check if locker already exists
    const existing = db.prepare("SELECT 1 FROM lockers WHERE number = ?").get(number);
    if (existing) {
      return res.status(400).json({ error: `Locker number ${number} already exists.` });
    }

    try {
      const info = db.prepare("INSERT INTO lockers (number, total_boxes) VALUES (?, ?)").run(number, total_boxes || 12);
      
      // Create boxes for the locker
      const lockerId = info.lastInsertRowid;
      const insertBox = db.prepare("INSERT INTO boxes (locker_id, box_number) VALUES (?, ?)");
      for (let i = 1; i <= (total_boxes || 12); i++) {
        insertBox.run(lockerId, i);
      }

      db.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)")
        .run('CREATE_LOCKER', 'locker', lockerId, `Created locker ${number}`);

      res.json({ id: lockerId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lockers/:id/boxes", (req, res) => {
    const boxes = db.prepare(`
      SELECT b.*, c.name as customer_name, l.loan_number 
      FROM boxes b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN loans l ON b.loan_id = l.id
      WHERE b.locker_id = ?
    `).all(req.params.id);
    res.json(boxes);
  });

  app.post("/api/boxes/:id/assign", (req, res) => {
    const { packet_id, loan_id, customer_id } = req.body;
    db.prepare(`
      UPDATE boxes 
      SET packet_id = ?, loan_id = ?, customer_id = ?, status = 'occupied' 
      WHERE id = ?
    `).run(packet_id, loan_id, customer_id, req.params.id);
    
    db.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)")
      .run('ASSIGN_BOX', 'box', req.params.id, `Assigned to Loan ID: ${loan_id}, Packet: ${packet_id}`);

    res.json({ success: true });
  });

  app.post("/api/boxes/:id/empty", (req, res) => {
    db.prepare("UPDATE boxes SET packet_id = NULL, loan_id = NULL, customer_id = NULL, status = 'empty' WHERE id = ?").run(req.params.id);
    
    db.prepare("INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)")
      .run('EMPTY_BOX', 'box', req.params.id, `Emptied box`);

    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      const settingsObj = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    try {
      const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
      const transaction = db.transaction((data) => {
        for (const [key, value] of Object.entries(data)) {
          upsert.run(key, String(value));
        }
      });
      transaction(settings);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Audit Logs
  app.get("/api/admin/sql", (req, res) => {
    res.status(405).json({ error: "Use POST to execute queries" });
  });

  app.post("/api/admin/sql", (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
      const stmt = db.prepare(query);
      if (query.trim().toLowerCase().startsWith('select') || query.trim().toLowerCase().startsWith('pragma')) {
        const rows = stmt.all();
        res.json(rows);
      } else {
        const result = stmt.run();
        res.json({ success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid });
      }
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get("/api/audit-logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").all();
    res.json(logs);
  });

  // Reports Endpoints
  app.get("/api/reports/released-items", (req, res) => {
    try {
      const loans = db.prepare(`
        SELECT l.*, c.name as customer_name 
        FROM loans l
        JOIN customers c ON l.customer_id = c.id
        WHERE l.status = 'closed'
        ORDER BY l.updated_at DESC
      `).all();
      res.json(loans);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/reports/day-book", (req, res) => {
    const { date } = req.query;
    const targetDate = date ? (date as string) : new Date().toISOString().split('T')[0];
    
    try {
      // Get loans disbursed on that day
      const loans = db.prepare(`
        SELECT 'LOAN' as type, loan_number as ref, amount, customer_id, created_at as time
        FROM loans 
        WHERE date(created_at) = date(?)
      `).all(targetDate);

      // Get payments received on that day
      const payments = db.prepare(`
        SELECT 'PAYMENT' as type, 'PAY-' || id as ref, amount, (SELECT customer_id FROM loans WHERE id = payments.loan_id) as customer_id, created_at as time
        FROM payments
        WHERE date(created_at) = date(?)
      `).all(targetDate);

      // Get top-ups on that day
      const topUps = db.prepare(`
        SELECT 'TOP-UP' as type, 'TOP-' || id as ref, amount, (SELECT customer_id FROM loans WHERE id = top_ups.loan_id) as customer_id, created_at as time
        FROM top_ups
        WHERE date(created_at) = date(?)
      `).all(targetDate);

      const allTransactions = [...loans, ...payments, ...topUps].sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      res.json(allTransactions);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Global error handler for Express
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Error:', err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack 
    });
  });
}

startServer();
