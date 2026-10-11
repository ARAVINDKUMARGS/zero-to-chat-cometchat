process.env.COMETCHAT_APP_ID = '16846826f41673716';
process.env.COMETCHAT_REGION = 'in';
process.env.COMETCHAT_REST_API_KEY = '81c7c43c586b602178680746f7ff5b556ae9be9d';

const BASE = `https://${process.env.COMETCHAT_APP_ID}.api-${process.env.COMETCHAT_REGION}.cometchat.io/v3`;

async function cc(method, route, body) {
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: {
      apikey: process.env.COMETCHAT_REST_API_KEY,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (err) {
    json = null;
  }

  console.log('CALL', method, route, 'STATUS', res.status, 'JSON', JSON.stringify(json));
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const uid = 'alice';
  console.log('START');
  let found = await cc('GET', `/users/${encodeURIComponent(uid)}`);
  if (!found.ok && found.status === 404) {
    const created = await cc('POST', '/users', { uid, name: uid });
    console.log('user create ok?', created.ok, created.status, JSON.stringify(created.json));
  }

  for (const guid of ['devconnect-general', 'devconnect-frontend', 'devconnect-backend', 'devconnect-code-review', 'devconnect-hackathon']) {
    const r = await cc('POST', `/groups/${encodeURIComponent(guid)}/members`, { participants: [uid] });
    console.log('join result', guid, r.status, JSON.stringify(r.json));
  }

  const token = await cc('POST', `/users/${encodeURIComponent(uid)}/auth_tokens`, {});
  console.log('token result', token.status, JSON.stringify(token.json));
}

main().catch((err) => {
  console.error('OUTER', err);
  process.exit(1);
});
