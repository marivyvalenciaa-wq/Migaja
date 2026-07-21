// server.js — API + sitio estático de La Migaja, con Supabase como base de datos
const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const supabase = require("./supabaseClient");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function publicUser(row) {
  return { username: row.username, role: row.role, nombre: row.nombre, iniciales: row.iniciales };
}

/* ================= AUTENTICACIÓN ================= */

app.post("/api/register", async (req, res) => {
  const { nombre, usuario, password } = req.body || {};
  if (!nombre || !usuario || !password) {
    return res.status(400).json({ error: "Complete todos los campos." });
  }
  const username = String(usuario).trim().toLowerCase();
  if (username === "administrador") {
    return res.status(400).json({ error: "Ese usuario ya existe. Elija otro." });
  }

  const { data: existing } = await supabase.from("usuarios").select("id").eq("username", username).maybeSingle();
  if (existing) return res.status(409).json({ error: "Ese usuario ya existe. Elija otro." });

  const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "CL";
  const password_hash = bcrypt.hashSync(password, 10);

  const { data, error } = await supabase
    .from("usuarios")
    .insert({ username, password_hash, role: "cliente", nombre: nombre.trim(), iniciales })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "No se pudo crear la cuenta." });
  res.json({ user: publicUser(data) });
});

app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) return res.status(400).json({ error: "Complete todos los campos." });

  const username = String(usuario).trim().toLowerCase();
  const { data: row } = await supabase.from("usuarios").select("*").eq("username", username).maybeSingle();

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }
  res.json({ user: publicUser(row) });
});

/* ================= PEDIDOS ================= */

app.get("/api/pedidos", async (req, res) => {
  const { username } = req.query;
  let query = supabase.from("pedidos").select("*").order("id", { ascending: false });
  if (username) query = query.eq("username", username);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "No se pudieron cargar los pedidos." });
  res.json(data);
});

app.post("/api/pedidos", async (req, res) => {
  const { username, cliente_nombre, producto, cantidad } = req.body || {};
  if (!username || !producto || !cantidad) return res.status(400).json({ error: "Datos incompletos." });

  const { data, error } = await supabase
    .from("pedidos")
    .insert({ username, cliente_nombre: cliente_nombre || username, producto, cantidad, estado: "pendiente" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "No se pudo enviar el pedido." });
  res.json(data);
});

app.patch("/api/pedidos/:id", async (req, res) => {
  const { estado } = req.body || {};
  const { data, error } = await supabase
    .from("pedidos")
    .update({ estado })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "No se pudo actualizar el pedido." });
  res.json(data);
});

/* ================= RESERVAS ================= */

app.get("/api/reservas", async (req, res) => {
  const { username } = req.query;
  let query = supabase.from("reservas").select("*").order("id", { ascending: false });
  if (username) query = query.eq("username", username);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "No se pudieron cargar las reservas." });
  res.json(data);
});

app.post("/api/reservas", async (req, res) => {
  const { username, cliente_nombre, fecha, hora, personas } = req.body || {};
  if (!username || !fecha || !hora || !personas) return res.status(400).json({ error: "Datos incompletos." });

  const { data, error } = await supabase
    .from("reservas")
    .insert({ username, cliente_nombre: cliente_nombre || username, fecha, hora, personas, estado: "pendiente" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "No se pudo enviar la reserva." });
  res.json(data);
});

app.patch("/api/reservas/:id", async (req, res) => {
  const { estado } = req.body || {};
  const { data, error } = await supabase
    .from("reservas")
    .update({ estado })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "No se pudo actualizar la reserva." });
  res.json(data);
});

/* ================= AVISOS ================= */

app.get("/api/avisos", async (req, res) => {
  const { data, error } = await supabase.from("avisos").select("*").order("id", { ascending: false });
  if (error) return res.status(500).json({ error: "No se pudieron cargar los avisos." });
  res.json(data);
});

app.post("/api/avisos", async (req, res) => {
  const { texto } = req.body || {};
  if (!texto) return res.status(400).json({ error: "Escriba un texto." });

  const { data, error } = await supabase.from("avisos").insert({ texto }).select().single();
  if (error) return res.status(500).json({ error: "No se pudo publicar el aviso." });
  res.json(data);
});

/* ================= ESTADÍSTICAS ================= */

app.get("/api/stats", async (req, res) => {
  const { count, error } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("role", "cliente");

  if (error) return res.status(500).json({ error: "No se pudieron cargar las estadísticas." });
  res.json({ clientes: count || 0 });
});

// Localmente (npm start) sí levantamos un servidor que escucha en un puerto.
// En Vercel, el archivo se importa como función y esto se salta —
// Vercel llama a la app directamente en cada solicitud.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`La Migaja corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;

