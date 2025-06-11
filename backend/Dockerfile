# Base image Ubuntu
FROM ubuntu:22.04

# Install Node.js 20.x, Python 3.10, pip, dan dependencies build
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    nodejs \
    npm \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pm2 global untuk Node.js process manager
RUN npm install -g pm2

# Setup working directory
WORKDIR /app

# Copy backend Express.js
COPY backend /app/backend

# Copy Flask backend
COPY backend/python /app/python

# Install Node.js dependencies
WORKDIR /app/backend
RUN npm install

# Install Python dependencies
WORKDIR /app/python
RUN pip3 install --no-cache-dir -r requirements.txt

# Expose ports (Express di 5000, Flask di 5001)
EXPOSE 5000
EXPOSE 5001

# Jalankan kedua aplikasi secara bersamaan
CMD pm2 start /app/backend/src/app.js --name express-backend && \
    gunicorn --bind 0.0.0.0:5001 app:app
