#!/bin/bash
# Menemukan dan menghentikan proses npm run start-all yang sedang berjalan

# Menemukan ID proses yang berjalan dengan perintah npm run start-all
PID=$(ps aux | grep 'npm run start-all' | grep -v 'grep' | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "Tidak ada proses npm run start-all yang berjalan."
else
    echo "Menghentikan proses npm run start-all dengan PID: $PID"
    kill $PID  # Menghentikan proses dengan PID yang ditemukan
fi
