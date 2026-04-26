const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oydiupghailhpksifrep.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZGl1cGdoYWlsaHBrc2lmcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MDY0MjcsImV4cCI6MjA5MjI4MjQyN30.rlUwVgmFIlCspJqBHrkXoC6Fw7-9_KCW_o3_wXmTab0'
);

async function test() {
  const { data, error } = await supabase
    .from('finance_records')
    .select('*');
    
  console.log("Error:", error);
  console.log("Total Count Finance:", data ? data.length : 0);
  if(data && data.length > 0) {
    const types = [...new Set(data.map(d => d.type))];
    console.log("Unique TYPEs found:", types);
  }
}

test();
