import { supabase } from "./src/lib/supabase/client.ts";

async function run() {
  console.log("Fetching production_recipes...");
  const t0 = Date.now();
  const { data, error } = await supabase.from("production_recipes").select("*");
  console.log(`Took ${Date.now() - t0}ms`);
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
