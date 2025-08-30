const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the database folder
const dbPath = path.join(__dirname, 'photos.db');
const db = new sqlite3.Database(dbPath);

console.log('Setting up SQLite database...');

// Create photos table with exactly the columns you need
db.run(`
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    filename TEXT,
    path_to_watermark TEXT,
    path_to_clean TEXT,
    updated TEXT,
    price REAL,
    category TEXT
  )
`, (err) => {
  if (err) {
    console.error('Error creating photos table:', err);
  } else {
    console.log('Photos table created successfully');
  }
});

// Create orders table with email field
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    photo_ids TEXT,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    mypos_order_id TEXT,
    email TEXT,
    created_at TEXT,
    updated_at TEXT
  )
`, (err) => {
  if (err) {
    console.error('Error creating orders table:', err);
  } else {
    console.log('Orders table created successfully');
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database setup completed!');
      console.log('Tables created: photos, orders');
    }
  });
});
