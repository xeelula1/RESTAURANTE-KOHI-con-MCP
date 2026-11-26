require('dotenv').config();
const path = require('path');
const express = require('express');
const authRoutes = require('./routes/auth-routes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// Monitor en tiempo real de peticiones en terminal (respetando Zero-Leak Policy: sin exponer passwords ni tokens)
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ▶ ENTRADA: ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ◀ SALIDA:  ${req.method} ${req.originalUrl} -> HTTP ${res.statusCode} (${durationMs}ms)`
    );
  });

  next();
});

// 4. Sirve estáticos desde public/
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de API
app.use('/api', authRoutes);

// Manejo de JSON malformado
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Cuerpo JSON inválido' });
  }
  return next(err);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Kōhi Cafetería escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;
