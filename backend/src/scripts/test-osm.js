import axios from 'axios';

// 💡 Standalone test for OpenStreetMap Overpass API
const testFetch = async () => {
  console.log('🌍 Testing connection to OpenStreetMap Overpass API...');
  
  // Testing with just one city (Mumbai) for speed
  const city = { name: 'Mumbai', coords: '19.0760,72.8777' };

  try {
    // Query: Find nodes with office=ngo OR amenity=social_facility within 5km
    const query = `
      [out:json];
      (
        node["office"="ngo"](around:5000,${city.coords});
        node["amenity"="social_facility"](around:5000,${city.coords});
      );
      out body;
    `;
    
    console.log(`   📡 Sending query for ${city.name}...`);
    const response = await axios.post('https://overpass-api.de/api/interpreter', query);
    
    if (response.data && response.data.elements) {
      const results = response.data.elements;
      console.log(`   ✅ Success! Found ${results.length} raw results.`);
      
      // Filter for items with names (to see quality)
      const named = results.filter(item => item.tags && item.tags.name);
      console.log(`   🏷️  Found ${named.length} items with valid names.`);
      
      if (named.length > 0) {
        console.log('\n   --- Sample Data Preview ---');
        named.slice(0, 3).forEach(item => {
          console.log(`   Example: ${item.tags.name} (${item.lat}, ${item.lon})`);
          if (item.tags.website) console.log(`      Website: ${item.tags.website}`);
          if (item.tags.phone) console.log(`      Phone: ${item.tags.phone}`);
        });
      }
    } else {
      console.log('   ⚠️ API returned no data structure.');
    }
    
  } catch (error) {
    console.error(`   ❌ API Call Failed: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
  }
};

testFetch();