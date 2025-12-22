/**
 * NGO Data Sync Script
 * 
 * Exports NGO data from MongoDB to CSV format for AI clustering service.
 * This script bridges the gap between your live MongoDB database and the
 * AI service's requirement for CSV-formatted data.
 * 
 * Usage:
 *   node backend/src/scripts/syncNGOData.js
 * 
 * Or from package.json:
 *   npm run sync-ngos
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// CSV output path (for AI service)
const OUTPUT_PATH = path.join(__dirname, '../../../data/ngos.csv');

class NGODataSyncer {
  constructor() {
    this.ngos = [];
    this.stats = {
      total: 0,
      exported: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify';
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(mongoURI);
      console.log('✅ Connected to MongoDB\n');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    }
  }

  /**
   * Fetch NGO/Recipient users from MongoDB
   */
  async fetchNGOs() {
    try {
      console.log('📊 Fetching NGO/Recipient users...');
      
      const recipients = await User.find({ 
        role: 'recipient',
        status: 'active' 
      }).select(
        'name email location organization recipientProfile statistics createdAt'
      );

      this.stats.total = recipients.length;
      console.log(`   Found ${recipients.length} recipient users\n`);

      return recipients;
    } catch (error) {
      console.error('❌ Error fetching NGOs:', error.message);
      throw error;
    }
  }

  /**
   * Transform MongoDB document to CSV row format
   */
  transformToCSV(ngo) {
    try {
      // Extract coordinates
      const longitude = ngo.location?.coordinates?.coordinates?.[0] || 0;
      const latitude = ngo.location?.coordinates?.coordinates?.[1] || 0;

      // Skip if no valid location
      if (latitude === 0 && longitude === 0) {
        console.warn(`   ⚠️  Skipping ${ngo.name} - No valid coordinates`);
        this.stats.skipped++;
        return null;
      }

      // Get clustering data using the model method
      const clusterData = ngo.getClusteringData();

      // Return CSV row object
      return {
        NGO_ID: ngo._id.toString(),
        Name: this.escapeCSV(ngo.name || 'Unknown'),
        Email: this.escapeCSV(ngo.email || ''),
        City: this.escapeCSV(ngo.location?.city || 'Unknown'),
        State: this.escapeCSV(ngo.location?.state || ''),
        Latitude: latitude.toFixed(6),
        Longitude: longitude.toFixed(6),
        Special_Focus: this.escapeCSV(clusterData.special_focus),
        Capacity_per_week: clusterData.capacity_per_week,
        Urgent_Need: clusterData.urgent_need ? 'True' : 'False',
        Cause: this.escapeCSV(clusterData.cause),
        Acceptance_Rate: clusterData.acceptance_rate.toFixed(2),
        Organization_Name: this.escapeCSV(ngo.organization?.name || ''),
        Organization_Type: this.escapeCSV(ngo.organization?.type || ''),
        Total_Donations_Received: ngo.statistics?.totalDonations || 0,
        Total_Requests_Made: ngo.statistics?.totalRequests || 0,
        Created_At: ngo.createdAt?.toISOString() || ''
      };
    } catch (error) {
      console.error(`   ❌ Error transforming ${ngo.name}:`, error.message);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Escape CSV values (handle commas, quotes, newlines)
   */
  escapeCSV(value) {
    if (value === null || value === undefined) return '';
    
    const str = String(value);
    
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}`;
    }
    
    return str;
  }

  /**
   * Write NGO data to CSV file
   */
  async writeCSV(ngoData) {
    try {
      console.log('\n📝 Writing CSV file...');

      // Ensure data directory exists
      const dataDir = path.dirname(OUTPUT_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create CSV header
      const headers = [
        'NGO_ID', 'Name', 'Email', 'City', 'State', 'Latitude', 'Longitude',
        'Special_Focus', 'Capacity_per_week', 'Urgent_Need', 'Cause', 'Acceptance_Rate',
        'Organization_Name', 'Organization_Type', 'Total_Donations_Received', 
        'Total_Requests_Made', 'Created_At'
      ];

      // Convert to CSV rows
      const csvRows = [headers.join(',')];
      
      ngoData.forEach(ngo => {
        const row = headers.map(header => ngo[header] || '').join(',');
        csvRows.push(row);
      });

      // Write to file
      const csvContent = csvRows.join('\n');
      fs.writeFileSync(OUTPUT_PATH, csvContent, 'utf8');

      console.log(`   ✅ CSV file written: ${OUTPUT_PATH}`);
      console.log(`   📊 Exported ${ngoData.length} NGOs\n`);

      this.stats.exported = ngoData.length;
    } catch (error) {
      console.error('❌ Error writing CSV:', error.message);
      throw error;
    }
  }

  /**
   * Create a backup of the old CSV file
   */
  createBackup() {
    if (fs.existsSync(OUTPUT_PATH)) {
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const backupPath = OUTPUT_PATH.replace('.csv', `_backup_${timestamp}.csv`);
      
      try {
        fs.copyFileSync(OUTPUT_PATH, backupPath);
        console.log(`💾 Backup created: ${path.basename(backupPath)}\n`);
      } catch (error) {
        console.warn('⚠️  Could not create backup:', error.message);
      }
    }
  }

  /**
   * Print summary statistics
   */
  printStats() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total NGOs found:        ${this.stats.total}`);
    console.log(`Successfully exported:   ${this.stats.exported}`);
    console.log(`Skipped (no location):   ${this.stats.skipped}`);
    console.log(`Errors:                  ${this.stats.errors}`);
    console.log('='.repeat(60) + '\n');

    if (this.stats.exported > 0) {
      console.log('✅ Sync completed successfully!');
      console.log(`\n🔄 Next steps:`);
      console.log(`   1. Restart your AI service to pick up the new data`);
      console.log(`   2. Run clustering: python ai_service/services/clustering.py`);
      console.log(`   3. Test clustering endpoint: GET /api/ai/clusters\n`);
    } else {
      console.warn('⚠️  No NGOs were exported. Check your data and try again.\n');
    }
  }

  /**
   * Main sync process
   */
  async sync() {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🔄 NGO DATA SYNC - MongoDB to CSV');
      console.log('='.repeat(60) + '\n');

      // Connect to database
      await this.connect();

      // Create backup of existing CSV
      this.createBackup();

      // Fetch NGOs from MongoDB
      const ngos = await this.fetchNGOs();

      // Transform to CSV format
      console.log('🔄 Transforming data to CSV format...');
      const ngoData = ngos
        .map(ngo => this.transformToCSV(ngo))
        .filter(row => row !== null); // Remove nulls (skipped entries)

      console.log(`   ✅ Transformed ${ngoData.length} NGOs\n`);

      // Write CSV file
      if (ngoData.length > 0) {
        await this.writeCSV(ngoData);
      } else {
        console.warn('⚠️  No valid NGO data to export!\n');
      }

      // Print summary
      this.printStats();

      // Close database connection
      await mongoose.connection.close();
      console.log('🔌 Database connection closed\n');

    } catch (error) {
      console.error('\n❌ SYNC FAILED:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const syncer = new NGODataSyncer();
  syncer.sync().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default NGODataSyncer;
