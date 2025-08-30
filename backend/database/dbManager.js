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
          path_to_watermark,
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
          path_to_clean,
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
      const { id, filename, path_to_watermark, path_to_clean, price, category } = photoData;
      const updated = new Date().toISOString();
      
      this.db.run(`
        INSERT INTO photos (id, filename, path_to_watermark, path_to_clean, updated, price, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, filename, path_to_watermark, path_to_clean, updated, price, category], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Update photo
  updatePhoto(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      this.db.run(`
        UPDATE photos SET ${setClause}, updated = ? WHERE id = ?
      `, [...values, new Date().toISOString(), id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Delete photo
  deletePhoto(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM photos WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Get photo by ID
  getPhotoById(id) {
    console.log(`getPhotoById called with ID: ${id} (type: ${typeof id})`);
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM photos WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error(`Database error in getPhotoById for ID ${id}:`, err);
          reject(err);
        } else {
          console.log(`Database result for ID ${id}:`, row ? 'Found' : 'Not found');
          resolve(row);
        }
      });
    });
  }

  // Get photos by category
  getPhotosByCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM photos WHERE category = ? ORDER BY updated DESC', [category], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // ORDER OPERATIONS

  // Create new order
  createOrder(orderData) {
    return new Promise((resolve, reject) => {
      const { id, photo_ids, total_amount, email, mypos_order_id } = orderData;
      const now = new Date().toISOString();
      
      this.db.run(`
        INSERT INTO orders (id, photo_ids, total_amount, status, mypos_order_id, email, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
      `, [id, photo_ids, total_amount, mypos_order_id, email, now, now], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Get order by ID
  getOrderById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Update order status
  updateOrderStatus(id, status, mypos_order_id = null) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      let query, params;
      
      if (mypos_order_id) {
        query = 'UPDATE orders SET status = ?, mypos_order_id = ?, updated_at = ? WHERE id = ?';
        params = [status, mypos_order_id, now, id];
      } else {
        query = 'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?';
        params = [status, now, id];
      }
      
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Update order (any field)
  updateOrder(id, updates) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const updateFields = [];
      const params = [];
      
      // Build dynamic update query
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
          updateFields.push(`${key} = ?`);
          params.push(updates[key]);
        }
      });
      
      if (updateFields.length === 0) {
        resolve(0);
        return;
      }
      
      // Add updated_at timestamp
      updateFields.push('updated_at = ?');
      params.push(now);
      
      // Add WHERE clause
      params.push(id);
      
      const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
      
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Get all orders
  getAllOrders() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get orders by status
  getOrdersByStatus(status) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', [status], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Delete order
  deleteOrder(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = DatabaseManager;
