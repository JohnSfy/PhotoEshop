const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, 'photos.db');
    this.db = null;
  }

  // Initialize database connection
  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection failed:', err);
          reject(err);
        } else {
          console.log('Database connected successfully');
          resolve(true);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          this.db = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // PHOTO OPERATIONS

  // Get all photos
  getAllPhotos() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM photos ORDER BY updated DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get watermarked photos only
  getWatermarkedPhotos() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id,
          watermark_path,
          filename,
          price,
          updated,
          category
        FROM photos 
        ORDER BY updated DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get clean photos by IDs
  getCleanPhotosByIds(photoIds) {
    if (!photoIds || photoIds.length === 0) return Promise.resolve([]);
    
    const placeholders = photoIds.map(() => '?').join(',');
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id,
          clean_path,
          filename,
          price,
          updated,
          category
        FROM photos
        WHERE id IN (${placeholders})
        ORDER BY updated DESC
      `, photoIds, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Add new photo
  addPhoto(photoData) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO photos (
          id, watermark_path, clean_path, filename, price, category
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        photoData.id,
        photoData.watermarkPath,
        photoData.cleanPath,
        photoData.filename,
        photoData.price,
        photoData.category || 'other'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Update photo category
  updatePhotoCategory(photoId, category) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE photos 
        SET category = ?, updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [category, photoId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Update photo price
  updatePhotoPrice(photoId, price) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE photos 
        SET price = ?, updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [price, photoId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Delete photo
  deletePhoto(photoId) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        DELETE FROM photos WHERE id = ?
      `, [photoId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Get photos by category
  getPhotosByCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM photos WHERE category = ? ORDER BY updated DESC
      `, [category], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get all categories
  getAllCategories() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT DISTINCT category FROM photos WHERE category IS NOT NULL ORDER BY category
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Search photos
  searchPhotos(query, category = null) {
    let sql = `SELECT * FROM photos WHERE filename LIKE ?`;
    const params = [`%${query}%`];
    
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    
    sql += ` ORDER BY updated DESC`;
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get photo count by category
  getPhotoCountByCategory() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT category, COUNT(*) as count
        FROM photos 
        GROUP BY category 
        ORDER BY count DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get total photo count
  getTotalPhotoCount() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM photos', (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
  }

  // Get photo count by category
  getPhotoCountByCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM photos WHERE category = ?', [category], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
  }

  // Delete photos by category
  deletePhotosByCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM photos WHERE category = ?', [category], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = DatabaseManager;
