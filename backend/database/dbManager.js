const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, 'photos.db');
    this.db = null;
  }

  // Initialize database connection
  init() {
    try {
      this.db = new Database(this.dbPath);
      console.log('Database connected successfully');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // PHOTO OPERATIONS

  // Get all photos
  getAllPhotos() {
    const stmt = this.db.prepare(`
      SELECT * FROM photos ORDER BY updated DESC
    `);
    return stmt.all();
  }

  // Get watermarked photos only
  getWatermarkedPhotos() {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        watermark_path,
        filename,
        price,
        updated,
        category
      FROM photos 
      ORDER BY updated DESC
    `);
    return stmt.all();
  }

  // Get clean photos by IDs
  getCleanPhotosByIds(photoIds) {
    if (!photoIds || photoIds.length === 0) return [];
    
    const placeholders = photoIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
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
    `);
    return stmt.all(photoIds);
  }

  // Add new photo
  addPhoto(photoData) {
    const stmt = this.db.prepare(`
      INSERT INTO photos (
        id, watermark_path, clean_path, filename, price, category
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      photoData.id,
      photoData.watermarkPath,
      photoData.cleanPath,
      photoData.filename,
      photoData.price,
      photoData.category || 'other'
    );
    
    return result.lastInsertRowid;
  }

  // Update photo category
  updatePhotoCategory(photoId, category) {
    const stmt = this.db.prepare(`
      UPDATE photos 
      SET category = ?, updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(category, photoId);
  }

  // Update photo price
  updatePhotoPrice(photoId, price) {
    const stmt = this.db.prepare(`
      UPDATE photos 
      SET price = ?, updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(price, photoId);
  }

  // Delete photo
  deletePhoto(photoId) {
    const stmt = this.db.prepare(`
      DELETE FROM photos WHERE id = ?
    `);
    return stmt.run(photoId);
  }

  // Get photos by category
  getPhotosByCategory(category) {
    const stmt = this.db.prepare(`
      SELECT * FROM photos WHERE category = ? ORDER BY updated DESC
    `);
    return stmt.all(category);
  }

  // Get all categories
  getAllCategories() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT category FROM photos WHERE category IS NOT NULL ORDER BY category
    `);
    return stmt.all();
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
    
    const stmt = this.db.prepare(sql);
    return stmt.all(params);
  }

  // Get photo count by category
  getPhotoCountByCategory() {
    const stmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM photos 
      GROUP BY category 
      ORDER BY count DESC
    `);
    return stmt.all();
  }

  // Get total photo count
  getTotalPhotoCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM photos');
    return stmt.get().count;
  }
}

module.exports = DatabaseManager;
