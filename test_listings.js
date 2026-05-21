const http = require('http');

function request(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const req = http.request(parsed, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, headers: res.headers, body: data });
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function testUser(name, email, password) {
    console.log(`\n========== Testing ${name} (${email}) ==========`);

    // 1. Login
    let cookies = '';
    try {
        const loginBody = JSON.stringify({ email, password });
        const res = await request('http://localhost:8002/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
        }, loginBody);

        const data = JSON.parse(res.body);
        console.log('Login status:', res.status);
        if (data.user) {
            console.log('User:', data.user.id, '|', data.user.name, '| role:', data.user.activeRole);
        } else {
            console.log('Login error:', data.message || res.body);
            return;
        }

        // Extract cookies
        const setCookies = res.headers['set-cookie'] || [];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
        console.log('Cookies:', cookies.substring(0, 100));
    } catch (e) {
        console.error('Login failed:', e.message);
        return;
    }

    // 2. Call my-listings
    try {
        const res = await request('http://localhost:8002/api/properties/my-listings', {
            method: 'GET',
            headers: { 'Cookie': cookies }
        });
        const data = JSON.parse(res.body);
        console.log('My-listings status:', res.status);
        console.log('Properties count:', data.properties?.length ?? 'N/A');
        console.log('Stats:', JSON.stringify(data.stats));
        (data.properties || []).forEach(p => console.log(` - ${p.title} (${p.listingType}) sellerId:${p.sellerId}`));
    } catch (e) {
        console.error('My-listings failed:', e.message);
    }
}

async function main() {
    await testUser('Mani', 'mani@gmail.com', '12345678');
    await testUser('Naveen', 'naveen@gmail.com', '12345678');
}

main().catch(console.error);
