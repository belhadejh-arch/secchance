import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { resolveDatabaseConfig } from './dbConfig.js';

// Every test run uses its own schema; never delete or rewrite real user records.
test('the configured Neon database is the single preferred source in every environment', () => {
  assert.deepEqual(
    resolveDatabaseConfig({ NODE_ENV: 'production', DATABASE_URL: 'other-db', NEON_DATABASE_URL: 'accounts-db' }),
    { connectionString: 'accounts-db', source: 'NEON_DATABASE_URL' }
  );
  assert.deepEqual(
    resolveDatabaseConfig({ NODE_ENV: 'development', DATABASE_URL: 'replit-db', NEON_DATABASE_URL: 'accounts-db' }),
    { connectionString: 'accounts-db', source: 'NEON_DATABASE_URL' }
  );
  assert.deepEqual(
    resolveDatabaseConfig({ NODE_ENV: 'test', TEST_DATABASE_URL: 'isolated-test-db', DATABASE_URL: 'real-db' }),
    { connectionString: 'isolated-test-db', source: 'TEST_DATABASE_URL' }
  );
  assert.deepEqual(
    resolveDatabaseConfig({ NODE_ENV: 'production', DATABASE_URL: 'only-db' }),
    { connectionString: 'only-db', source: 'DATABASE_URL' }
  );
});

test('account approval, service publication and demo booking lifecycle', {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  const schema = `scp_test_${crypto.randomBytes(8).toString('hex')}`;
  const oldOptions = process.env.PGOPTIONS;
  const oldNodeEnv = process.env.NODE_ENV;
  const oldMode = process.env.PAYMENT_MODE;
  const oldChargily = process.env.CHARGILY_MODE;
  process.env.NODE_ENV = 'test';
  process.env.PGOPTIONS = `--search_path=${schema}`;
  process.env.PAYMENT_MODE = 'demo';
  process.env.CHARGILY_MODE = 'test';
  const { pool } = await import('./db.js');
  const { dispatchApi } = await import('./routes.js');
  const { createSessionToken, hashPassword } = await import('./security.js');
  const { ensureDemoServices } = await import('./demoServices.js');
  const server = http.createServer(async (req, res) => {
    try {
      await dispatchApi(req, res);
    } catch (error) {
      res.writeHead(error.status || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
  try {
    await pool.query(`CREATE SCHEMA ${schema}`);
    await pool.query(await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    // Account activation must also work on legacy databases without this
    // optional uniqueness constraint.
    await pool.query('ALTER TABLE services DROP CONSTRAINT IF EXISTS services_provider_id_category_key');
    // Booking must not depend on the conversation-participant unique
    // constraint, which is absent from the existing shared database.
    await pool.query(
      'ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_conversation_id_user_id_key'
    );
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    async function api(path, method = 'GET', body, cookie) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(cookie
          ? cookie.startsWith('Bearer ') ? { Authorization: cookie } : { Cookie: cookie }
          : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    }
    const adminPassword = crypto.randomUUID();
    const admin = await pool.query(
      `INSERT INTO users (first_name,last_name,email,phone,password,role_id,role_slug,status,is_verified)
       VALUES ('Test','Admin','admin@example.invalid','0500000000',$1,
        (SELECT id FROM roles WHERE slug='admin'),'admin','active',1) RETURNING id`,
      [await hashPassword(adminPassword)]
    );
    const adminCookie = `scp_session=${createSessionToken(admin.rows[0])}`;
    const login = await api('/auth/login', 'POST', {
      email: 'admin@example.invalid', password: adminPassword,
    });
    assert.equal(login.status, 200);
    const bearer = `Bearer ${login.data.sessionToken}`;
    assert.equal((await api('/bootstrap', 'GET', null, bearer)).data.user.roleSlug, 'admin');
    const input = (roleSlug, email) => ({
      firstName: 'Test', lastName: 'Account', email, phone: '0500000000',
      password: crypto.randomUUID(), roleSlug, consentAccepted: true,
      specialty: 'اختبار', licenseNumber: 'TEST-LICENSE', wilayaName: '16 - الجزائر',
    });

    const provider = await api('/auth/register', 'POST', input('psychologist', 'provider@example.invalid'));
    assert.equal(provider.status, 201, JSON.stringify(provider.data));
    assert.equal(provider.data.user.status, 'pending_approval');
    assert.deepEqual((await api('/public/services')).data, []);

    const beneficiary = await api('/auth/register', 'POST', input('user', 'client@example.invalid'));
    assert.equal(beneficiary.status, 201);
    assert.equal(beneficiary.data.user.status, 'pending_approval');
    const adminData = await api('/bootstrap', 'GET', null, adminCookie);
    assert.equal(adminData.status, 200, JSON.stringify(adminData.data));
    assert.equal(adminData.data.users.filter((u) => u.status === 'pending_approval').length, 2);
    assert.equal(adminData.data.notifications.length, 2);

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const slot = { date: tomorrow, time: '10:00', durationMinutes: 60 };
    const pendingAvailability = await api('/profile/availability', 'PATCH', { slots: [slot] }, provider.cookie);
    assert.equal(pendingAvailability.status, 403, JSON.stringify(pendingAvailability.data));
    for (const account of [provider, beneficiary]) {
      const approved = await api(`/users/${account.data.user.id}`, 'PATCH', { status: 'active' }, adminCookie);
      assert.equal(approved.status, 200, JSON.stringify(approved.data));
    }
    const availability = await api('/profile/availability', 'PATCH', { slots: [slot] }, provider.cookie);
    assert.equal(availability.status, 200, JSON.stringify(availability.data));
    const publicServices = await api('/public/services');
    assert.equal(publicServices.data.length, 1);
    const service = publicServices.data[0];
    const requestBody = {
      providerId: provider.data.user.id, serviceId: service.id, category: 'psychological',
      description: 'طلب استشارة للاختبار', consentAccepted: true,
      appointmentDate: tomorrow, appointmentTime: '10:00',
    };
    const booked = await api('/requests', 'POST', requestBody, beneficiary.cookie);
    assert.equal(booked.status, 201, JSON.stringify(booked.data));
    const id = booked.data.id;
    const conflict = await api('/requests', 'POST', requestBody, beneficiary.cookie);
    assert.equal(conflict.status, 409);
    const unauthorizedPayment = await api(`/requests/${id}/demo-payment`, 'POST', {}, provider.cookie);
    assert.equal(unauthorizedPayment.status, 404);
    const paid = await api(`/requests/${id}/demo-payment`, 'POST', {}, beneficiary.cookie);
    assert.equal(paid.status, 200, JSON.stringify(paid.data));
    assert.equal(paid.data.paymentStatus, 'PAID');
    assert.equal((await api(`/requests/${id}/demo-payment`, 'POST', {}, beneficiary.cookie)).status, 200);
    const snapshot = await api('/bootstrap', 'GET', null, beneficiary.cookie);
    assert.equal(snapshot.status, 200, JSON.stringify(snapshot.data));
    assert.equal(snapshot.data.requests[0].status, 'APPOINTMENT_CONFIRMED');
    assert.equal(snapshot.data.appointments[0].status, 'CONFIRMED');
    assert.equal(snapshot.data.transactions.length, 1);
    assert.equal(snapshot.data.transactions[0].paymentMethod, 'DEMO');
    assert.equal(snapshot.data.transactions[0].status, 'SUCCESSFUL');

    const createdByAdmin = await api('/users', 'POST', {
      ...input('lawyer', 'admin-created@example.invalid'), status: 'active', accountType: 'lawyer',
    }, bearer);
    assert.equal(createdByAdmin.status, 201, JSON.stringify(createdByAdmin.data));
    assert.equal(createdByAdmin.cookie, undefined);
    assert.equal((await api('/auth/me', 'GET', null, bearer)).data.user.roleSlug, 'admin');
    assert.equal((await api('/public/services')).data.length, 2);
    const duplicate = await api('/users', 'POST', input('lawyer', 'admin-created@example.invalid'), adminCookie);
    assert.equal(duplicate.status, 409);
    const blocked = await api('/users', 'POST', input('lawyer', 'blocked@example.invalid'), beneficiary.cookie);
    assert.equal(blocked.status, 403);
    for (const roleSlug of ['doctor', 'legal_advisor', 'clinic', 'hospital', 'treatment_center', 'association']) {
      const professional = await api('/users', 'POST', {
        ...input(roleSlug, `${roleSlug}@example.invalid`), status: 'active',
        organizationName: 'مؤسسة اختبار', address: 'عنوان اختبار',
      }, adminCookie);
      assert.equal(professional.status, 201, `${roleSlug}: ${JSON.stringify(professional.data)}`);
    }
    assert.equal((await api('/public/services')).data.length, 4);
    const secondSlot = { ...slot, time: '11:00' };
    await api('/profile/availability', 'PATCH', { slots: [slot, secondSlot] }, provider.cookie);
    const competingBookings = await Promise.all([
      api('/requests', 'POST', { ...requestBody, appointmentTime: '11:00' }, beneficiary.cookie),
      api('/requests', 'POST', { ...requestBody, appointmentTime: '11:00' }, beneficiary.cookie),
    ]);
    assert.deepEqual(competingBookings.map((r) => r.status).sort(), [201, 409]);
    await api(`/users/${provider.data.user.id}`, 'PATCH', { status: 'suspended' }, adminCookie);
    assert.equal((await api('/public/services')).data.length, 3);

    process.env.PAYMENT_MODE = 'live';
    assert.equal((await api('/public/config')).data.demoPayments, false);
    assert.equal((await api(`/requests/${id}/demo-payment`, 'POST', {}, beneficiary.cookie)).status, 403);
    process.env.PAYMENT_MODE = 'demo';
    await ensureDemoServices();
    await ensureDemoServices();
    const demoServices = (await api('/public/services')).data.filter((s) => s.isDemo);
    assert.equal(demoServices.length, 2);
    assert.deepEqual(demoServices.map((s) => s.category).sort(), ['legal', 'psychological']);
    const pendingClient = await api('/auth/register', 'POST', input('user', 'trial@example.invalid'));
    const pendingBearer = `Bearer ${pendingClient.data.sessionToken}`;
    for (const demo of demoServices) {
      const trial = await api('/requests', 'POST', {
        ...requestBody, providerId: demo.providerId, serviceId: demo.id,
        category: demo.category, appointmentTime: demo.category === 'legal' ? '14:00' : '15:00',
      }, pendingBearer);
      assert.equal(trial.status, 201, JSON.stringify(trial.data));
      const paidTrial = await api(`/requests/${trial.data.id}/demo-payment`, 'POST', {}, pendingBearer);
      assert.equal(paidTrial.status, 200, JSON.stringify(paidTrial.data));
    }
    const trialSnapshot = (await api('/bootstrap', 'GET', null, pendingBearer)).data;
    assert.equal(trialSnapshot.appointments.filter((a) => a.status === 'CONFIRMED').length, 2);
    const synchronized = (await api('/bootstrap', 'GET', null, bearer)).data;
    assert.ok(synchronized.users.some((u) => u.id === pendingClient.data.user.id));
    assert.equal(synchronized.requests.filter((r) => r.clientId === pendingClient.data.user.id).length, 2);
    assert.equal(synchronized.services.filter((s) => s.isDemo).length, 2);
    process.env.PAYMENT_MODE = 'live';
    assert.equal((await api('/public/services')).data.some((s) => s.isDemo), false);

    // Exercise the actual frontend data service with cookies entirely absent,
    // as in an embedded browser that blocks third-party cookies.
    const { createServer } = await import('vite');
    const vite = await createServer({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    const nativeFetch = globalThis.fetch;
    const previousWindow = globalThis.window;
    const storage = new Map();
    const events = new EventTarget();
    let signalBootstrapStarted;
    const bootstrapStarted = new Promise((resolve) => { signalBootstrapStarted = resolve; });
    let unsubscribe;
    try {
      globalThis.window = {
        sessionStorage: {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, value),
          removeItem: (key) => storage.delete(key),
        },
        dispatchEvent: (event) => events.dispatchEvent(event),
      };
      globalThis.fetch = async (path, options) => {
        if (
          options &&
          typeof path === 'string' &&
          path.endsWith('/bootstrap') &&
          !options.headers?.Authorization &&
          storage.size === 0
        ) {
          signalBootstrapStarted();
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        const url = typeof path === 'string' && path.startsWith('/api/v1')
          ? `${base.replace('/api/v1', '')}${path}`
          : path;
        return nativeFetch(url, options);
      };
      const client = await vite.ssrLoadModule('/src/services/dbService.ts');
      let visibleUsers = [];
      unsubscribe = client.subscribeToUsers((users) => { visibleUsers = users; });
      await bootstrapStarted;
      const frontendLogin = await client.authenticateUser('admin@example.invalid', adminPassword);
      assert.equal(frontendLogin.user.roleSlug, 'admin');
      assert.equal((await client.getCurrentUser()).roleSlug, 'admin');
      const frontendCreated = await client.createUserInDb({
        ...input('lawyer', 'frontend-created@example.invalid'),
        accountType: 'lawyer', status: 'active',
      });
      assert.ok(visibleUsers.some((u) => u.id === frontendCreated.id && u.roleSlug === 'lawyer'));
      assert.equal((await client.getCurrentUser()).roleSlug, 'admin');
      const selfCreated = await client.registerUserInDb(input('user', 'self-frontend@example.invalid'));
      assert.equal(selfCreated.status, 'pending_approval');
      process.env.PAYMENT_MODE = 'demo';
      const demo = demoServices.find((s) => s.category === 'legal');
      const frontendBooking = await client.createCareRequestInDb({
        ...requestBody, providerId: demo.providerId, serviceId: demo.id,
        category: 'legal', priority: 'Medium', appointmentTime: '17:00',
      });
      assert.equal(frontendBooking.status, 'WAITING_PAYMENT');
      await client.confirmDemoAppointmentInDb(frontendBooking.id);
      assert.equal((await client.getCurrentUser()).id, selfCreated.id);
      const confirmedFrontend = (await api('/bootstrap', 'GET', null, `Bearer ${storage.get('scp_session_token')}`)).data;
      assert.equal(confirmedFrontend.requests[0].status, 'APPOINTMENT_CONFIRMED');
      assert.equal(confirmedFrontend.transactions[0].paymentMethod, 'DEMO');
      await client.authenticateUser('admin@example.invalid', adminPassword);
      assert.ok(visibleUsers.some((u) => u.id === selfCreated.id));
      await client.logoutUser();
      assert.equal((await client.getCurrentUser()), null);
    } finally {
      unsubscribe?.();
      globalThis.fetch = nativeFetch;
      globalThis.window = previousWindow;
      await vite.close();
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
    if (oldOptions === undefined) delete process.env.PGOPTIONS;
    else process.env.PGOPTIONS = oldOptions;
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNodeEnv;
    if (oldMode === undefined) delete process.env.PAYMENT_MODE;
    else process.env.PAYMENT_MODE = oldMode;
    if (oldChargily === undefined) delete process.env.CHARGILY_MODE;
    else process.env.CHARGILY_MODE = oldChargily;
  }
});
