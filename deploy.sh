#!/usr/bin/env bash
# Build the React app, package the Lambda (Linux wheels + code + web/), and deploy it.
set -euo pipefail
cd "$(dirname "$0")"
PY=.venv/Scripts/python; [ -x "$PY" ] || PY=.venv/bin/python

(cd frontend && npm ci && npm run build)          # -> ../web

rm -rf package chatbot.zip
"$PY" -m pip install -q --target package --platform manylinux2014_x86_64 \
  --implementation cp --python-version 3.13 --only-binary=:all: anthropic
cp -r chatbot.py lambda_function.py faq.txt web package/
"$PY" - <<'PY'
import os, zipfile
with zipfile.ZipFile("chatbot.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk("package"):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, "package").replace(os.sep, "/"))
PY

aws lambda update-function-code --function-name faq-bot --zip-file fileb://chatbot.zip --query LastUpdateStatus --output text
aws lambda wait function-updated-v2 --function-name faq-bot
echo "Deployed: $(aws lambda get-function-url-config --function-name faq-bot --query FunctionUrl --output text)"
