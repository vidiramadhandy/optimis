#!/bin/bash

# Hentikan proses backend
BACKEND_PID=$(ps aux | grep 'npm run start-backend' | grep -v 'grep' | awk '{print $2}')
if [ ! -z "$BACKEND_PID" ]; then
    echo "Menghentikan proses backend (PID: $BACKEND_PID)"
    kill $BACKEND_PID
else
    echo "Tidak ada proses backend yang berjalan."
fi

# Hentikan proses frontend
FRONTEND_PID=$(ps aux | grep 'npm run dev-frontend' | grep -v 'grep' | awk '{print $2}')
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Menghentikan proses frontend (PID: $FRONTEND_PID)"
    kill $FRONTEND_PID
else
    echo "Tidak ada proses frontend yang berjalan."
fi

# Hentikan proses Python
PYTHON_PID=$(ps aux | grep 'python3 app.py' | grep -v 'grep' | awk '{print $2}')
if [ ! -z "$PYTHON_PID" ]; then
    echo "Menghentikan proses Python (PID: $PYTHON_PID)"
    kill $PYTHON_PID
else
    echo "Tidak ada proses Python yang berjalan."
fi

echo "Semua proses yang terkait dengan 'start-all' telah dihentikan."
