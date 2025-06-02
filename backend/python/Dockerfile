# Multi-stage build untuk optimasi
FROM python:3.9-slim as builder

WORKDIR /app

# Install system dependencies untuk compile packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.9-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd --create-home --shell /bin/bash flask

# Copy installed packages dari builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# PERBAIKAN: Copy model files dengan permission yang benar
COPY catboost_model_2.cbm ./catboost_model_2.cbm
COPY snr_minmax_scaler_untuk_prediksi.pkl ./snr_minmax_scaler_untuk_prediksi.pkl

# Set proper permissions untuk model files
RUN chmod 644 *.cbm *.pkl

# Copy source code
COPY . .

# Set ownership
RUN chown -R flask:flask /app

USER flask

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "app.py"]
