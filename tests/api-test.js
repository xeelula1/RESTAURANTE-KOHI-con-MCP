const assert = require('assert');
const http = require('http');
const app = require('../src/server');
const { db } = require('../src/db');

function requestJson(port, method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathUrl,
        method,
        headers: reqHeaders
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch (_e) {
            // mantener texto plano para estáticos
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  const testEmail = `unit.test.${Date.now()}@kohi.com`;
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const badReg = await requestJson(port, 'POST', '/api/register', { name: 'Incomplete' });
    assert.strictEqual(badReg.status, 400, 'Registro con campos faltantes debe devolver 400');

    const okReg = await requestJson(port, 'POST', '/api/register', {
      name: 'Unit Tester',
      email: testEmail,
      password: 'Password123!'
    });
    assert.strictEqual(okReg.status, 201, 'Registro válido debe devolver 201');
    assert.strictEqual(typeof okReg.data.position, 'number', 'Debe devolver posición numérica');

    const dupReg = await requestJson(port, 'POST', '/api/register', {
      name: 'Unit Tester 2',
      email: testEmail,
      password: 'Password123!'
    });
    assert.strictEqual(dupReg.status, 409, 'Email duplicado debe devolver 409');

    const badLogin = await requestJson(port, 'POST', '/api/login', {
      email: testEmail,
      password: 'WrongPassword!'
    });
    assert.strictEqual(badLogin.status, 401, 'Credenciales inválidas deben devolver 401');

    const okLogin = await requestJson(port, 'POST', '/api/login', {
      email: testEmail,
      password: 'Password123!'
    });
    assert.strictEqual(okLogin.status, 200, 'Login válido debe devolver 200');
    assert.ok(okLogin.data.token, 'Login válido debe incluir token JWT');

    const unauthMe = await requestJson(port, 'GET', '/api/me');
    assert.strictEqual(unauthMe.status, 401, '/api/me sin token debe devolver 401');

    const okMe = await requestJson(port, 'GET', '/api/me', null, {
      Authorization: `Bearer ${okLogin.data.token}`
    });
    assert.strictEqual(okMe.status, 200, '/api/me con JWT válido debe devolver 200');
    assert.strictEqual(okMe.data.email, testEmail);
    assert.strictEqual(okMe.data.position, okReg.data.position);
    assert.ok(okMe.data.total >= 2, 'Total en waitlist debe ser >= 2');

    for (const page of ['/', '/register.html', '/login.html', '/dashboard.html', '/styles.css']) {
      const staticRes = await requestJson(port, 'GET', page);
      assert.strictEqual(staticRes.status, 200, `Estático ${page} debe responder 200`);
    }

    db.prepare('DELETE FROM waitlist WHERE email = ?').run(testEmail);

    console.log('TODOS LOS TESTS (5A y 5B) PASARON EXITOSAMENTE');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Fallo en tests:', err.message);
  process.exit(1);
});
