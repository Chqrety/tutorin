 
  const { createClient } = require("@supabase/supabase-js")
  const supabaseUrl = 'https://gwwedlvktdusrvejswti.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3d2VkbHZrdGR1c3J2ZWpzd3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MDczMDYsImV4cCI6MjA1MzM4MzMwNn0.UiPtyI8HhpUxUebqxB8DCCd3RN44U_IuuJ9gyz_Qj34'
  const supabase = createClient(supabaseUrl, supabaseKey)
  

async function setupDatabase() {
  try {
    const { data, error } = await supabase.rpc("setup_kampuskarirku_database")

    if (error) {
      console.error("Error setting up database:", error)
    } else {
      console.log("Database setup completed successfully:", data)
    }
  } catch (error) {
    console.error("Caught an exception:", error)
  }
}

setupDatabase()

