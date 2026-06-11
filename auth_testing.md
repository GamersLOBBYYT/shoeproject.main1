# Auth Testing Playbook (SOLE app)

App has DUAL auth: JWT email/password + Emergent Google OAuth. Both set httpOnly cookies
(secure, samesite=none). Bearer Authorization header also accepted on all protected endpoints.

## Step 1: JWT credentials (seeded at startup)
- Admin: admin@sole.com / Admin@123
- Customer: john@sole.com / Password123

```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"john@sole.com","password":"Password123"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```

## Step 2: Google OAuth test session (manual seed)
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', picture: '', role: 'customer', auth_provider: 'google', created_at: new Date().toISOString()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(), created_at: new Date().toISOString()});
print('Session token: ' + sessionToken);
"

Then:
```
curl -X GET "http://localhost:8001/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser testing (set cookie)
await page.context.add_cookies([{ "name": "session_token", "value": "YOUR_SESSION_TOKEN", "domain": "<app-domain>", "path": "/", "httpOnly": true, "secure": true, "sameSite": "None" }]);

For JWT, simpler: drive the UI login form at /auth (data-testid: auth-email-input, auth-password-input, auth-submit-btn).

## Protected endpoints
- GET /api/orders, GET /api/orders/{id}, GET /api/orders/{id}/tracking
- POST /api/orders (demo payment, instant paid)
- POST /api/checkout/session, GET /api/checkout/status/{session_id}

## Success indicators
- /api/auth/me returns user with user_id
- /orders page loads (not redirected to /auth)
- Order placement via demo payment returns order with status "paid"

## Cleanup
mongosh --eval "use('test_database'); db.users.deleteMany({email: /test\\.user\\./}); db.user_sessions.deleteMany({session_token: /test_session/});"
