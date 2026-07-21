// supabaseClient.js — conexión del backend a Supabase
// Usa la SERVICE ROLE KEY (nunca la exponga en el frontend/navegador,
// solo vive aquí, en el servidor).

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env"
  );
}
console.log("URL leída del .env:", JSON.stringify(supabaseUrl));
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

module.exports = supabase;
