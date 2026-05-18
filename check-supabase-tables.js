// Run this in your browser console to check which tables exist
// Copy-paste into DevTools Console while on the app

const supabase = window.supabaseClient; // Adjust if different

async function checkTables() {
  console.log("Checking Supabase tables...\n");

  const tables = ["profiles", "user_roles", "teachers", "students", "classes"];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .limit(1);

      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    } catch (e) {
      console.error(`❌ ${table}: ${e.message}`);
    }
  }

  console.log("\nDone. Check results above.");
}

checkTables();
