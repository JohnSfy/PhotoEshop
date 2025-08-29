const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the database folder
const dbPath = path.join(__dirname, 'photos.db');
const db = new sqlite3.Database(dbPath);

console.log('Setting up SQLite database...');

// Create simple photos table with exactly the columns you need
db.run(`
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    watermark_path TEXT NOT NULL,
    clean_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    price REAL DEFAULT 5.99,
    updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    category TEXT DEFAULT 'other'
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Database setup completed!');
    console.log('Table created: photos');
    console.log('Columns: id, watermark_path, clean_path, filename, price, updated, category');
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
  });
});
