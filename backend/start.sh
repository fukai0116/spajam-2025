# Render.com用の簡単なスタートアップスクリプト
#!/bin/bash

echo "🚀 Starting SPAJAM 2025 Backend..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Node.jsアプリケーションを起動
exec node src/server.js