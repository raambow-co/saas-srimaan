import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn(`Warning: Could not create data directory: ${e.message}`);
  }
}

export class MockModel {
  constructor(collectionName, defaultData = []) {
    this.collectionName = collectionName;
    this.defaultData = defaultData;
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(defaultData, null, 2));
      } catch (e) {
        console.warn(`Warning: Could not write default data for ${collectionName} to filesystem:`, e.message);
      }
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return this.defaultData || [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`Error reading mock db file ${this.collectionName}:`, e);
      return this.defaultData || [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing mock db file ${this.collectionName}:`, e);
    }
  }

  async find(filter = {}) {
    let items = this.read();
    return items.filter(item => {
      for (let key in filter) {
        if (filter[key] !== undefined) {
          // Handles simple matching and exact array/object equality (if strings)
          if (typeof filter[key] === 'object' && filter[key] !== null) {
            // Check for MongoDB-like operators
            if (filter[key].$ne !== undefined) {
              if (item[key] === filter[key].$ne) return false;
            } else if (filter[key].$in !== undefined) {
              if (!Array.isArray(filter[key].$in) || !filter[key].$in.includes(item[key])) return false;
            }
          } else if (item[key] !== filter[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    const items = await this.find(filter);
    return items[0] || null;
  }

  async findById(id) {
    const items = this.read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(data) {
    const items = this.read();
    const newItem = {
      _id: 'mock_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this.write(items);
    return newItem;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const items = this.read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    let updatedItem = { ...items[index] };
    
    // Support MongoDB $push
    if (update.$push) {
      for (let key in update.$push) {
        if (!updatedItem[key]) updatedItem[key] = [];
        updatedItem[key].push(update.$push[key]);
      }
      delete update.$push;
    }

    // Support MongoDB $pull
    if (update.$pull) {
      for (let key in update.$pull) {
        if (Array.isArray(updatedItem[key])) {
          updatedItem[key] = updatedItem[key].filter(v => v !== update.$pull[key]);
        }
      }
      delete update.$pull;
    }

    // Apply basic top-level updates
    updatedItem = {
      ...updatedItem,
      ...update,
      updatedAt: new Date().toISOString()
    };

    items[index] = updatedItem;
    this.write(items);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const items = this.read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1);
    this.write(items);
    return deleted[0];
  }

  async deleteMany(filter = {}) {
    const items = this.read();
    const remaining = items.filter(item => {
      for (let key in filter) {
        if (item[key] === filter[key]) return false;
      }
      return true;
    });
    this.write(remaining);
    return { deletedCount: items.length - remaining.length };
  }

  async countDocuments(filter = {}) {
    const items = await this.find(filter);
    return items.length;
  }
}
