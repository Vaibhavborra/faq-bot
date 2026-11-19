"""AWS Lambda entry point. GET / serves the chat page; POST / answers a question."""
import base64
import json
from pathlib import Path

from chatbot import ask

PAGE = (Path(__file__).parent / "index.html").read_text()


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    if method == "GET":
        return {"statusCode": 200, "headers": {"Content-Type": "text/html"}, "body": PAGE}

    body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode()
    question = str(json.loads(body).get("question", "")).strip()[:500]

    if not question:
        answer = "Please type a question."
    else:
        try:
            answer = ask(question)
        except Exception as exc:
            print("Error:", repr(exc))
            answer = f"Error: {exc}"

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"answer": answer}),
    }
