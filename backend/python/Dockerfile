FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create user
RUN useradd --create-home --shell /bin/bash flask

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set ownership
RUN chown -R flask:flask /app

USER flask

EXPOSE 5000

CMD ["python", "app.py"]
