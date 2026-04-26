const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oydiupghailhpksifrep.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZGl1cGdoYWlsaHBrc2lmcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDY0MjcsImV4cCI6MjA5MjI4MjQyN30.rlUwVgmFIlCspJqBHrkXoC6Fw7-9_KCW_o3_wXmTab0'
);

async function test() {
  const { data, error } = await supabase
    .from('finance_records')
    .select('*')
    .eq('type', 'gelir');
    
  console.log("Error:", error);
  console.log("Count:", data ? data.length : 0);
  if(data && data.length > 0) {
    console.log("First 3 records sample:", JSON.stringify(data.slice(0,3), null, 2));
    
    const statuses = [...new Set(data.map(d => d.status))];
    console.log("Unique statuses found:", statuses);
    
    // Check dates and company_ids
    const dates = [...new Set(data.map(d => d.date))];
    console.log("Unique dates found:", dates);
    
    const companies = [...new Set(data.map(d => d.company_id))];
    console.log("Unique company_ids found:", companies);
  }
}

test();
