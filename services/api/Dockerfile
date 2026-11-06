FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    SAAKH_ENV=production SAAKH_DB_PATH=/data/saakh.db
WORKDIR /srv/api
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" "pydantic>=2.7" sqlmodel pandas numpy \
    scikit-learn xgboost shap joblib python-multipart python-docx
COPY services/api/app ./app
COPY services/api/artifacts ./artifacts
COPY services/api/data ./seed-data
# Seed files (personas, CSV) are read from data/; the SQLite file itself lives on the /data volume.
RUN useradd -r -u 10001 saakh && mkdir -p /data && chown saakh /data && ln -s /srv/api/seed-data /srv/api/data
USER saakh
VOLUME /data
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/api/health')" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--workers", "2"]
