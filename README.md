## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
4. Open **http://localhost:3000/** (or **http://127.0.0.1:3000/**)

### Demo login credentials

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Platform Admin | `admin@concretepoa.com` | `Admin123!` | ConcretePOA Platform |
| Tester | `tester@concretepoa.com` | `Tester123!` | ConcretePOA Platform |
| Tenant Admin | `admin@acmelegal.com` | `AcmeAdmin1!` | Acme Legal Group |
| User | `user@acmelegal.com` | `User123!` | Acme Legal Group |
| User (other tenant) | `user@harbortrust.com` | `Harbor123!` | Harbor Trust Advisors |

Roles:
- **User** — run audits, view history and bank database (read-only add)
- **Tenant Admin** — user privileges + edit bank database + tenant user directory
- **Tester / Platform Admin** — cross-tenant directory and full admin access
