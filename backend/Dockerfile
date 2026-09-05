FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint"]
