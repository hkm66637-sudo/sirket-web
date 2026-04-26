const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
  console.log("🚀 Diagnostics: Checking 'companies' table...");
  const response = await supabase
    .from('companies')
    .select('*');
  
  const { data, error, status, statusText } = response;
  
  console.log("📊 Result:", { 
    count: data ? data.length : 0, 
    status, 
    statusText 
  });
  
  if (error) {
    console.error("❌ Error Detail:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ Data:", data);
  }
}

checkCompanies();
