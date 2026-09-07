# PharmaDrop

PharmaDrop is a role-based medicine-delivery tracking application. Pharmacy staff create deliveries, dispatchers assign riders, riders progress deliveries through handoff, and customers follow their orders and retrieve a delivery confirmation PIN.

## Features

- JWT authentication for customers, pharmacy staff, dispatchers, and riders.
- Pharmacy-scoped delivery data and rider assignment.
- Delivery flow: `PENDING` -> `ASSIGNED` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`, with dispatcher cancellation.
- Encrypted four-digit confirmation PINs and a three-failed-attempt lock.
- Delivery status history, cold-chain flags, priorities, payment collection, and customer notes.
- Optional Pusher private-channel updates, with 30-second dashboard refreshes as a fallback.
- Docker deployment with PostgreSQL, Django/Gunicorn, React/Vite, and Nginx.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Axios |
| Backend | Django, Django REST Framework, Simple JWT |
| Data | PostgreSQL in Docker; SQLite for local debug development |
| Realtime | Pusher Channels (optional) |
| Deployment | Docker Compose, Gunicorn, Nginx |

## Quick start with Docker

1. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace the values in `.env`. Generate a Django secret key with:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

3. Build and start the application:

   ```powershell
   docker compose up --build -d
   ```

4. Seed the demo data and open [http://localhost:8080](http://localhost:8080):

   ```powershell
   docker compose exec backend python manage.py seed_data
   ```

The frontend proxies `/api/` requests to Django. PostgreSQL is not exposed to the host.

## Local development

Run the backend in one terminal:

```powershell
Set-Location backend
$env:DJANGO_DEBUG = "true"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Run the frontend in another terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Vite development server forwards `/api` requests to `http://127.0.0.1:8000`.

## Demo accounts

After running `seed_data`, each account below uses password `password123`.

| Role | Username |
| --- | --- |
| Customer | `customer1` |
| Pharmacy staff | `staff1` |
| Dispatcher | `dispatcher1` |
| Rider | `rider1` |

`seed_data` clears application data before recreating the demo dataset. Do not run it against data that must be retained.

## API overview

All API routes are prefixed with `/api/`. Protected endpoints require `Authorization: Bearer <access_token>`.

| Endpoint | Purpose |
| --- | --- |
| `POST /auth/register/` | Register a customer |
| `POST /auth/login/` | Obtain JWT tokens |
| `POST /auth/refresh/` | Refresh an access token |
| `GET /auth/me/` | Get the signed-in user |
| `GET, POST /deliveries/` | List visible deliveries or create one |
| `POST /deliveries/{id}/assign/` | Assign a rider (dispatcher) |
| `POST /deliveries/{id}/update-status/` | Advance an assigned delivery (rider) |
| `POST /deliveries/{id}/confirm-delivery/` | Complete delivery with the PIN (rider) |
| `POST /deliveries/{id}/cancel/` | Cancel delivery (dispatcher) |
| `GET /riders/available/` | List a dispatcher's pharmacy riders |
| `GET /pharmacies/` | List pharmacies |

## Configuration

The Docker stack uses these `.env` values:

| Variable | Purpose |
| --- | --- |
| `POSTGRES_PASSWORD` | Application database password |
| `DJANGO_SECRET_KEY` | Django secret and source key material for PIN encryption |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated backend hosts |
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated trusted origins |

Pusher is disabled by default. Enable it by setting backend `PUSHER_APP_ID`, `PUSHER_KEY`, and `PUSHER_SECRET`, plus frontend `VITE_PUSHER_KEY` and, if needed, `VITE_PUSHER_CLUSTER` at build time.

## Testing

```powershell
Set-Location backend
$env:DJANGO_DEBUG = "true"
python manage.py test
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment notes and [TRADE_OFFS.md](TRADE_OFFS.md) for architectural decisions.
