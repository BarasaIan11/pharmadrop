# Production deployment

The project now runs as three containers: PostgreSQL, Django/Gunicorn, and the
Vite build served by Nginx. The frontend proxies `/api/` to the backend, so no
browser-visible backend URL is required for this deployment.

1. Copy `.env.example` to `.env` and replace every placeholder. Generate the
   Django key with `python -c "import secrets; print(secrets.token_urlsafe(50))"`.
2. Set domain values for `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and
   `CSRF_TRUSTED_ORIGINS` before exposing the service publicly.
3. Start the stack with `docker compose up --build -d`. The backend applies
   migrations and collects static assets on startup.
4. Put a TLS-terminating reverse proxy or managed load balancer in front of
   port 8080 and forward `X-Forwarded-Proto: https`. Do not expose PostgreSQL.

Before a real launch, change or remove the demo accounts created by
`seed_data`, configure backups for PostgreSQL, and enable managed monitoring
and error reporting. Pusher is disabled unless its environment variables are
provided. When enabled, pharmacy updates use authenticated private channels;
customers without a pharmacy continue to use dashboard polling.
