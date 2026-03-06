/**
 * test-api.js
 * -----------
 * Runs all GET / POST / PUT routes against the local backend.
 *
 * HOW TO USE
 * ----------
 * 1. Fill in the CONFIG section below (Firebase Web API Key + credentials).
 * 2. node scripts/test-api.js
 *
 * The script signs in both users via Firebase REST API, grabs their ID tokens,
 * then hits every route and prints a colour-coded summary.
 *
 * Requirements: Node 18+ (native fetch is used).
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const CONFIG = {
    /** Firebase Web API Key — find it in Firebase Console → Project Settings → General */
    firebaseApiKey: 'AIzaSyDeb337moEFQPmVIewN5YQMT2-UfQ9D95c',

    /** Back-end base URL */
    apiBase: 'http://localhost:3001/api/v1',

    /** Admin Firebase account */
    admin: {
        email: 'admin@admin.com',
        password: '6.SvC20_b68%a]Ba',
    },

    /** Normal user Firebase account */
    user: {
        email: 'teste2@gmail.com',
        password: '6.SvC20_b68%a]Ba',
    },

    /**
     * IDs used for parameterised routes.
     * Run the tests once to see what the list responses return,
     * then fill these in for more targeted testing.
     */
    sampleProductCode: 'DK5179BN',
    sampleProductId: '699de499461ef511866be6d6',
    sampleReportId: '690000000000000000000001',
};

// ─── COLOURS ─────────────────────────────────────────────────────────────────

const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function header(text) {
    const line = '─'.repeat(60);
    console.log(`\n${C.cyan}${C.bold}${line}${C.reset}`);
    console.log(`${C.cyan}${C.bold}  ${text}${C.reset}`);
    console.log(`${C.cyan}${C.bold}${line}${C.reset}`);
}

function badge(status) {
    if (status >= 200 && status < 300) return `${C.green}${C.bold} ${status} ✓ ${C.reset}`;
    if (status === 401) return `${C.yellow}${C.bold} ${status} ✗ UNAUTHORIZED${C.reset}`;
    if (status === 403) return `${C.yellow}${C.bold} ${status} ✗ FORBIDDEN${C.reset}`;
    if (status === 404) return `${C.gray}${C.bold} ${status} – NOT FOUND${C.reset}`;
    return `${C.red}${C.bold} ${status} ✗ ${C.reset}`;
}

async function signIn(email, password) {
    const url =
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CONFIG.firebaseApiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(
            `Firebase sign-in failed for ${email}: ${data.error?.message ?? JSON.stringify(data)}`
        );
    }
    return data.idToken;
}

async function hit(method, path, { token, body } = {}) {
    const url = `${CONFIG.apiBase}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
        const res = await fetch(url, opts);
        let json = null;
        try { json = await res.json(); } catch (_) { }
        return { status: res.status, json };
    } catch (err) {
        return { status: 0, error: err.message };
    }
}

function row(label, result) {
    const { status, error, json } = result;
    const b = error ? `${C.red} ERR (${error})${C.reset}` : badge(status);
    const hint = json?.error?.code ? `${C.gray}  → ${json.error.code}${C.reset}` : '';
    console.log(`  ${C.white}${label.padEnd(42)}${C.reset}${b}${hint}`);
}

// ─── TEST SUITES ─────────────────────────────────────────────────────────────

async function runProductTests(label, token) {
    header(`PRODUCTS  —  ${label}`);

    row('GET  /products',
        await hit('GET', '/products', { token }));

    row(`GET  /products/${CONFIG.sampleProductCode}`,
        await hit('GET', `/products/${CONFIG.sampleProductCode}`, { token }));

    row('POST /products  (create)',
        await hit('POST', '/products', {
            token,
            body: { product_code: `TEST-${Date.now()}`, description: 'Produto de teste via script', brand_name: 'DECA', base_price: 99.90 },
        }));

    row('PUT  /products/:id  (update)',
        await hit('PUT', `/products/${CONFIG.sampleProductId}`, {
            token,
            body: { description: 'Descrição atualizada via script' },
        }));
}

async function runReportTests(label, token) {
    header(`REPORTS  —  ${label}`);

    row('GET  /reports  (own)',
        await hit('GET', '/reports', { token }));

    row('GET  /reports?creator_id=...  (admin filter)',
        await hit('GET', '/reports?creator_id=someOtherUid', { token }));

    row(`GET  /reports/${CONFIG.sampleReportId}`,
        await hit('GET', `/reports/${CONFIG.sampleReportId}`, { token }));

    const created = await hit('POST', '/reports', {
        token,
        body: { title: `Relatório teste ${new Date().toISOString()}`, items: [] },
    });
    row('POST /reports  (create)', created);
}

async function runBrandTests(label, token) {
    header(`BRANDS  —  ${label}`);

    row('GET  /brands',
        await hit('GET', '/brands', { token }));

    row('POST /brands  (create)',
        await hit('POST', '/brands', {
            token,
            body: { brand_name: `DOKA` },
        }));
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n${C.bold}${C.cyan}  🚀  Auto Report — API Route Tester${C.reset}`);
    console.log(`${C.gray}  Base URL : ${CONFIG.apiBase}${C.reset}`);
    console.log(`${C.gray}  Time     : ${new Date().toLocaleString('pt-BR')}${C.reset}`);

    // ── Validate config ───────────────────────────────────────────────────────
    if (CONFIG.firebaseApiKey.startsWith('PASTE')) {
        console.error(`\n${C.red}✗  Fill in CONFIG.firebaseApiKey before running.${C.reset}`);
        process.exit(1);
    }

    // ── Sign in ───────────────────────────────────────────────────────────────
    let adminToken, userToken;

    process.stdout.write(`\n${C.gray}  Signing in admin (${CONFIG.admin.email})...${C.reset} `);
    try {
        adminToken = await signIn(CONFIG.admin.email, CONFIG.admin.password);
        console.log(`${C.green}✓${C.reset}`);
    } catch (e) {
        console.log(`${C.red}✗ ${e.message}${C.reset}`);
        process.exit(1);
    }

    process.stdout.write(`${C.gray}  Signing in user  (${CONFIG.user.email})...${C.reset}  `);
    try {
        userToken = await signIn(CONFIG.user.email, CONFIG.user.password);
        console.log(`${C.green}✓${C.reset}`);
    } catch (e) {
        console.log(`${C.red}✗ ${e.message}${C.reset}`);
        process.exit(1);
    }

    // ── Run tests  ────────────────────────────────────────────────────────────
    // await runProductTests('👑 ADMIN', adminToken);
    // await runProductTests('👤 USER', userToken);

    // await runReportTests('👑 ADMIN', adminToken);
    // await runReportTests('👤 USER', userToken);

    await runBrandTests('👑 ADMIN', adminToken);
    await runBrandTests('👤 USER', userToken);

    console.log(`\n${C.cyan}${'─'.repeat(60)}${C.reset}`);
    console.log(`${C.bold}${C.cyan}  ✅  Test run complete${C.reset}\n`);
}

main().catch(err => {
    console.error(`\n${C.red}Fatal error: ${err.message}${C.reset}`);
    process.exit(1);
});
