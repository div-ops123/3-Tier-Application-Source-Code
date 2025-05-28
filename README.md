# Dockerfile
- **Key Points**:
  - The Dockerfile uses `gunicorn` to run the Flask app (`run:app`), a production-grade WSGI server.
  - It installs `postgresql-client` and `libpq-dev`, indicating the app connects to PostgreSQL (via `DATABASE_URL`).
  - There’s no explicit mention of loading a `.env` file, suggesting the app relies on **environment variables** passed to the container at runtime.
  - The `migrate.sh` script runs `flask db migrate` and `flask db upgrade`, which also need `DATABASE_URL` and `FLASK_APP`.

**How Secrets Are Fetched**:
- **Locally**: The `.env` file sets environment variables (`DATABASE_URL`, `SECRET_KEY`, etc.), which are loaded by Flask using a library like `python-dotenv` (likely in `requirements.txt` or `app/config.py`).
- **In Kubernetes**: The app (running in the `devops-learning-backend` `Deployment` and `devops-learning-backend-migration` `Job`) expects the same environment variables. Your manifests provide these via:
  - **ASCP and `SecretProviderClass`**: Syncs Parameter Store secrets (`/devops-learning/db-username`, `/devops-learning/db-password`, `/devops-learning/db-name`, `/devops-learning/secret-key`) to a Kubernetes `Secret` (`devops-learning-secrets`).
  - **Environment Variables**: The `Deployment` and `Job` reference `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, and `SECRET_KEY` from `devops-learning-secrets`

**Issues:**
1. nginx.conf
Fix:
- **Short-Term:** Update nginx.conf in the frontend repository, rebuild, and push the image
- **Long-Term:** Use a ConfigMap to mount nginx.conf, avoiding image rebuilds for configuration changes. This is ideal if you expect frequent updates or want to streamline CI/CD.

I used the Short-Term solution because i do not expect frequent updates

---

# Jenkinsfile
| Stage              | Description                  |
| ------------------ | ---------------------------- |
| `checkout`         | Pull from GitHub             |
| `lint`             | Run ESLint / Prettier        |
| `unit test`        | Run Jest + Pytest            |
| `code scan`        | Run SonarQube analysis       |
| `sca scan`         | OWASP dependency-check       |
| `secrets`          | Run Gitleaks                 |
| `docker build`     | Build Flask + React          |
| `docker scan`      | Scan Docker image with Trivy |
| `docker push`      | Push image to Nexus          |
| `update manifest`  | Replace image tag in YAML    |
| `commit to GitOps` | Git push updated manifest    |
| `notify`           | Email build result           |

## ✅ Bonus Advice for Later
🧠 Move your app (frontend/, backend/, docker-compose.yaml) to a folder like /app, keep CI at root

## For Lint stage:
In frontend/ directory, ensure this is included in package.json:
```json
"scripts": {
  "lint": "eslint .",
  "format": "prettier --check ."
}
```
