# Basekohistate.md — Progreso de Base de Datos (Kohi Cafetería)

## 📌 Estado General
- **Proyecto:** Kohi Cafetería (Web con Waitlist)
- **Componente:** Base de Datos SQLite (`kohi.db`)
- **Ubicación:** `C:/Users/USER/Documents/bases de datos/kohi.db`
- **Administración:** Servidor MCP `sqlite` (`uvx --with "mcp<2" mcp-server-sqlite`)
- **Fecha:** 2026-11-26

## 🗄️ Esquema Creado (`waitlist`)
```sql
CREATE TABLE waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    position INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## ✅ Datos de Prueba Insertados y Verificados
| `id` | `name` | `email` | `password_hash` | `position` | `created_at` |
| :---: | :--- | :--- | :--- | :---: | :--- |
| `1` | Café Lover | `test@kohi.com` | `placeholder` | `1` | `2026-11-26 16:36:26` |
