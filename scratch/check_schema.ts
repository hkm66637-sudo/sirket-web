import { supabase } from "../src/lib/supabase";

async function checkSchema() {
  const { data, error } = await supabase.from('finance_records').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found in finance_records");
  }
}

checkSchema();
