<h2 align="center">
  MercurJS Multi Vendor Marketplace
</h2>
<h4 align="center">
  Backend + Owner/Admin dashboard + Vendor dashboard + Marketplace Storefront + PostgreSQL + Redis + Railway Bucket
</h4>

<p align="center">
  <a href="https://www.mercurjs.com/">
    <picture>
      <img alt="MercurJS Interfaces Stacked" src="https://res.cloudinary.com/hczpmiapo/image/upload/v1764888304/Static%20assets/graphics/MercurJS/mercur_interfaces_stacked_z1jrdg.avif">
    </picture>
  </a>
</p>


## 🚀 Quick Start

## Deploy with no manual setup in minutes
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/mercurjs?referralCode=-Yg50p)

### Any questinos about MercurJS on Railway? Ask here: https://station.railway.com/templates/mercurjs-10ceb1ef

## 🖥️ Local Setup

### 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20+** (Recommended: v22.13.1)
- **PostgreSQL 14+** (Running locally on port 5432)
- **pnpm** (Package manager)

### 🗂️ Project Structure

```
mercurjs-for-railway-boilerplate/
├── backend/          # Mercur backend (MedusaJS)
├── admin-panel/      # Admin dashboard (React/Vite)
├── vendor-panel/     # Vendor/seller dashboard (React/Vite)
└── storefront/       # Customer-facing storefront (Next.js)
```

### 1. Install Dependencies

All dependencies are already installed, but if you need to reinstall:

```bash
# Backend
cd mercurjs-for-railway-boilerplate/backend
pnpm install

# Admin Panel
cd ../admin-panel
pnpm install

# Vendor Panel
cd ../vendor-panel
pnpm install

# Storefront
cd ../storefront
pnpm install
```

### 2. Setup PostgreSQL Database

Make sure PostgreSQL is running, then create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mercurjs;

# Exit
\q
```

### 3. Setup Redis

Ensure Redis is running on port 6379. You can verify with:

```bash
redis-cli ping
# Should return: PONG
```

### 4. Run Database Migrations

```bash
cd mercurjs-for-railway-boilerplate/backend
npx medusa db:migrate
```

### 5. Seed the Database (Optional)

```bash
cd mercurjs-for-railway-boilerplate/backend
pnpm seed
```

### 6. Create Admin User

```bash
cd mercurjs-for-railway-boilerplate/backend
npx medusa user -e admin@test.com -p supersecret
```

## 🏃 Running the Services

You need to run all four services in separate terminal windows:

### Terminal 1: Backend

```bash
cd mercurjs-for-railway-boilerplate/backend
pnpm dev
```

**Runs on:** http://localhost:9000

### Terminal 2: Admin Panel

```bash
cd mercurjs-for-railway-boilerplate/admin-panel
pnpm dev
```

**Runs on:** http://localhost:5173

### Terminal 3: Vendor Panel

```bash
cd mercurjs-for-railway-boilerplate/vendor-panel
pnpm dev
```

**Runs on:** http://localhost:7001

### Terminal 4: Storefront

```bash
cd mercurjs-for-railway-boilerplate/storefront
pnpm dev
```

**Runs on:** http://localhost:3000

## 🔗 Service URLs

| Service      | URL                        | Login Credentials        |
|--------------|----------------------------|--------------------------|
| Backend API  | http://localhost:9000      | N/A                      |
| Admin Panel  | http://localhost:5173      | admin@test.com / supersecret |
| Vendor Panel | http://localhost:7001      | vendor@test.com / supersecret |
| Storefront   | http://localhost:3000      | N/A                      |

## ⚙️ Environment Variables

All environment files have been created:

- **Backend**: `mercurjs-for-railway-boilerplate/backend/.env`
- **Storefront**: `mercurjs-for-railway-boilerplate/storefront/.env.local`
- **Admin Panel**: `mercurjs-for-railway-boilerplate/admin-panel/.env`
- **Vendor Panel**: `mercurjs-for-railway-boilerplate/vendor-panel/.env`

### Backend Configuration

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mercurjs
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
```

Stripe is optional. Without both `STRIPE_SECRET_API_KEY` and
`STRIPE_WEBHOOK_SECRET`, the template uses Medusa's built-in system payment
provider so the demo can launch without a Stripe account. Providing both
enables Stripe checkout. `STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET` is the
separate Stripe Connect webhook signing secret used for seller payout accounts.

### Storefront Configuration

```env
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Admin Panel Configuration

```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3000
```

### Vendor Panel Configuration

```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3000
```

## 💾 File Storage

New Railway installations use a private Railway Bucket through Medusa's stock
S3 file provider. Browsers retrieve media through a small read-only Railway
Function named `Bucket-proxy`.

Wire the Backend service exactly as follows (Railway references are
case-sensitive):

```env
S3_ACCESS_KEY_ID=${{Bucket.ACCESS_KEY_ID}}
S3_SECRET_ACCESS_KEY=${{Bucket.SECRET_ACCESS_KEY}}
S3_BUCKET=${{Bucket.BUCKET}}
S3_ENDPOINT=${{Bucket.ENDPOINT}}
S3_REGION=${{Bucket.REGION}}
S3_FILE_URL=https://${{Bucket-proxy.RAILWAY_PUBLIC_DOMAIN}}
S3_ACL=false
```

Create `Bucket-proxy` as a Railway Function, give it the same five Bucket
credential variables, and paste this source:

```ts
import { S3Client } from "bun";

const CACHE_CONTROL =
  Bun.env.CACHE_CONTROL || "public, max-age=31536000, immutable";
const s3 = new S3Client({
  virtualHostedStyle: Bun.env.S3_VIRTUAL_HOSTED_STYLE !== "false",
});

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response('{"status":"ok"}', {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    let key: string;
    try {
      key = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return new Response("Not Found", { status: 404 });
    }

    if (!key || key.includes("\0")) {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const file = s3.file(key);
      const stat = await file.stat();
      const headers: Record<string, string> = {
        "Content-Type": stat.type || "application/octet-stream",
        "Content-Length": String(stat.size),
        "Cache-Control": CACHE_CONTROL,
      };

      return req.method === "HEAD"
        ? new Response(null, { headers })
        : new Response(file.stream(), { headers });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  },
};
```

```env
S3_BUCKET=${{Bucket.BUCKET}}
S3_REGION=${{Bucket.REGION}}
S3_ENDPOINT=${{Bucket.ENDPOINT}}
S3_ACCESS_KEY_ID=${{Bucket.ACCESS_KEY_ID}}
S3_SECRET_ACCESS_KEY=${{Bucket.SECRET_ACCESS_KEY}}
S3_VIRTUAL_HOSTED_STYLE=true
```

Generate its public domain, then set the Storefront variable:

```env
NEXT_PUBLIC_MEDIA_HOSTNAME=${{Bucket-proxy.RAILWAY_PUBLIC_DOMAIN}}
```

Do not set `S3_FORCE_PATH_STYLE` for Railway Bucket. The local Compose
environment sets it because MinIO is used there strictly as an S3 emulator.
For local development only, Compose makes the emulator bucket publicly
downloadable so it does not need to reproduce Railway Functions.
New Railway Buckets use virtual-hosted-style URLs. For an older Bucket whose
Credentials tab explicitly says it requires path-style URLs, set the Function's
`S3_VIRTUAL_HOSTED_STYLE=false`.
Production startup rejects missing, partial, mixed, or malformed storage
configuration instead of falling back to ephemeral disk. Do not add anonymous
`PUT` or `DELETE` handlers to the public Function: the Backend already performs
authenticated writes directly against `S3_ENDPOINT`.

Existing MinIO deployments may temporarily retain a complete
`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and optional
`MINIO_BUCKET` contract. Never mix those variables with any `S3_*` variable.
Existing media URLs stored in PostgreSQL are not rewritten; retain the old
MinIO endpoint while migrating objects/records, or re-upload affected media.

This template is intended for new deployments. Updating an existing production
installation is not a straightforward in-place upgrade. Keep the existing
stack running and read [UPGRADE.md](./UPGRADE.md) before considering a parallel,
manually validated migration.

For deterministic local infrastructure:

```bash
docker compose up --build
```

## 🔧 Troubleshooting

### PostgreSQL Connection Issues

If you get database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   pg_isready -U postgres
   ```

2. Check the connection string in `backend/.env`:
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/mercurjs
   ```

3. Ensure the database exists:
   ```bash
   psql -U postgres -l | grep mercurjs
   ```

### Redis Connection Issues

If you get Redis connection errors:

1. Verify Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check Redis URL in `backend/.env`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

### Port Already in Use

If a port is already in use, you can:

1. Kill the process using the port (Windows):
   ```bash
   netstat -ano | findstr :9000
   taskkill /PID <PID> /F
   ```

2. Or change the port in the respective service's configuration

### Node Version Issues

Mercur requires Node.js 20+. Check your version:

```bash
node --version
```

If using nvm:

```bash
nvm use 22
```

## 📚 Additional Commands

### Backend Commands

```bash
# Run migrations
pnpm medusa db:migrate

# Seed database
pnpm seed

# Create admin user
pnpm medusa user -e email@example.com -p password

# Build for production
pnpm build

# Start production server
pnpm start
```

### Admin Panel Commands

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Vendor Panel Commands

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Storefront Commands

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛠️ Development Notes

- **Backend** uses MedusaJS v2 with the MercurJS B2C marketplace plugin
- **Admin Panel** is a standalone React/Vite application with custom marketplace administration features
- **Vendor Panel** is a standalone React/Vite application for vendors/sellers to manage their products and orders
- **Storefront** is built with Next.js and includes marketplace-specific components
- All services communicate through the backend API on port 9000

## 📦 Database Schema

After running migrations, the following key tables will be created:

- Products, Variants, Inventory
- Orders, Payments, Fulfillments
- Customers, Users
- Sellers (marketplace-specific)
- Commissions (marketplace-specific)
- And many more...

## 🔐 Security Notes

⚠️ **For Production:**

1. Change all secrets in `.env` files
2. Use strong passwords for PostgreSQL and admin users
3. Configure proper CORS settings
4. Enable HTTPS
5. Use environment-specific configurations

## 📄 License

This project is based on MercurJS and MedusaJS. Please refer to their respective licenses.

## 🆘 Getting Help

- [MercurJS Documentation](https://docs.mercurjs.com)
- [MedusaJS Documentation](https://docs.medusajs.com)
- [MercurJS GitHub](https://github.com/mercurjs)

## 🎉 Next Steps

1. Access the admin panel at http://localhost:5173
2. Login with your admin credentials
3. Configure your store settings
4. Add products
5. Visit the storefront at http://localhost:3000

Happy selling! 🚀
