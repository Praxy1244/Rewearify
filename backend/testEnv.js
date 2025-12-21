import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Current directory:', __dirname);
console.log('📁 Looking for .env at:', join(__dirname, '.env'));
console.log('📁 File exists?', fs.existsSync(join(__dirname, '.env')));

// Try loading
dotenv.config({ path: join(__dirname, '.env') });

console.log('\n📊 Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ Not found');

if (process.env.MONGODB_URI) {
  console.log('Value preview:', process.env.MONGODB_URI.substring(0, 30) + '...');
}
