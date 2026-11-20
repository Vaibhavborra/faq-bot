"""AWS Lambda entry point for the Trailhead FAQ Bot.

This one function handles three kinds of events:

1. Cognito triggers
   - PostConfirmation: a new user confirmed their email -> email the admin Approve/Deny links.
   - PreAuthentication: block sign-in unless the user's `custom:approval` is "approved".
2. HTTP requests from the Lambda Function URL
   - POST /api/ask                 chat (needs a Cognito access token from an approved user)
   - GET  /api/admin/user          details for the approval page (signed link)
   - POST /api/admin/decide        approve / deny (signed link)
   - GET  anything else            the React single-page app in ./web
"""
import base64
import gzip
import hashlib
import hmac
import html
import json
import mimetypes
import os
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.exceptions import ClientError

from chatbot import ask

WEB = Path(__file__).parent / "web"
USER_POOL_ID = os.environ["USER_POOL_ID"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
PUBLIC_URL = os.environ["PUBLIC_URL"].rstrip("/")
SECRET = os.environ["SECRET_KEY"].encode()

COGNITO = boto3.client("cognito-idp")
SES = boto3.client("sesv2")

PENDING_MSG = "PENDING_APPROVAL"
DENIED_MSG = "ACCOUNT_DENIED"
TEXT_TYPES = ("text/", "application/javascript", "application/json", "image/svg+xml")


# ---------- helpers ----------

def respond(status, body, content_type="application/json", headers=None):
    if content_type == "application/json" and not isinstance(body, str):
        body = json.dumps(body)
    return {
        "statusCode": status,
        "headers": {"Content-Type": content_type, "Cache-Control": "no-store",
                    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin",
                    **(headers or {})},
        "body": body,
    }


def read_json(event):
    body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode()
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def sign(value: str) -> str:
    return hmac.new(SECRET, value.encode(), hashlib.sha256).hexdigest()


def valid_sig(username: str, sig: str) -> bool:
    return bool(username) and hmac.compare_digest(str(sig), sign(f"review|{username}"))


def attrs_to_dict(attrs):
    return {a["Name"]: a["Value"] for a in attrs}


# ---------- Cognito triggers ----------

def send_admin_email(username, name, email):
    sig = sign(f"review|{username}")
    link = f"{PUBLIC_URL}/admin/review?u={quote(username)}&sig={sig}"
    n, e = html.escape(name), html.escape(email)
    btn = ("display:inline-block;padding:12px 26px;border-radius:999px;font:600 15px system-ui,sans-serif;"
           "text-decoration:none;color:#fff;margin:0 6px")
    body_html = f"""<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1f2a24">
  <h2 style="margin:0 0 8px;color:#2f5d46">New sign-up request</h2>
  <p style="margin:0 0 18px">Someone confirmed their email and wants access to the Trailhead Assistant.</p>
  <table style="background:#f5f1e8;border-radius:12px;padding:14px 18px;width:100%;font-size:15px">
    <tr><td style="color:#6b6b5f;padding:4px 12px 4px 0">Name</td><td><b>{n}</b></td></tr>
    <tr><td style="color:#6b6b5f;padding:4px 12px 4px 0">Email</td><td>{e}</td></tr>
  </table>
  <p style="text-align:center;margin:26px 0">
    <a href="{link}&action=approve" style="{btn};background:#2f7d4f">Approve</a>
    <a href="{link}&action=deny" style="{btn};background:#b4442f">Deny</a>
  </p>
  <p style="font-size:12px;color:#8a8a7d">You'll confirm with one more tap on the next page.</p>
</div>"""
    SES.send_email(
        FromEmailAddress=f"Trailhead Assistant <{ADMIN_EMAIL}>",
        Destination={"ToAddresses": [ADMIN_EMAIL]},
        Content={"Simple": {
            "Subject": {"Data": f"Approve sign-up? {name} ({email})"},
            "Body": {
                "Html": {"Data": body_html},
                "Text": {"Data": f"New sign-up: {name} <{email}>\n"
                                 f"Approve: {link}&action=approve\nDeny: {link}&action=deny"},
            },
        }},
    )


def handle_trigger(event):
    source = event["triggerSource"]
    attrs = event.get("request", {}).get("userAttributes", {})
    if source == "PostConfirmation_ConfirmSignUp":
        try:
            send_admin_email(event["userName"], attrs.get("name", ""), attrs.get("email", ""))
        except Exception as exc:  # never block the user's confirmation because email failed
            print("Admin email failed:", repr(exc))
    elif source == "PreAuthentication_Authentication":
        status = attrs.get("custom:approval", "pending")
        if status == "denied":
            raise Exception(DENIED_MSG)
        if status != "approved":
            raise Exception(PENDING_MSG)
    return event


# ---------- API ----------

def approved_user(event):
    """Validate the caller's Cognito access token and return their attributes if approved."""
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    auth = headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    try:
        user = COGNITO.get_user(AccessToken=auth[7:].strip())
    except ClientError:
        return None
    attrs = attrs_to_dict(user["UserAttributes"])
    return attrs if attrs.get("custom:approval") == "approved" else None


def api_ask(event):
    if not approved_user(event):
        return respond(401, {"error": "Please sign in again."})
    data = read_json(event)
    question = str(data.get("question", "")).strip()[:500]
    history = data.get("history") if isinstance(data.get("history"), list) else []
    if not question:
        return respond(400, {"error": "Please type a question."})
    try:
        answer = ask(question, [t for t in history if isinstance(t, dict)])
    except Exception as exc:
        print("Error:", repr(exc))
        return respond(502, {"error": "The assistant is having trouble right now. Please try again."})
    return respond(200, {"answer": answer})


def admin_user(event):
    q = event.get("queryStringParameters") or {}
    username = q.get("u", "")
    if not valid_sig(username, q.get("sig", "")):
        return respond(403, {"error": "This approval link is invalid."})
    try:
        user = COGNITO.admin_get_user(UserPoolId=USER_POOL_ID, Username=username)
    except COGNITO.exceptions.UserNotFoundException:
        return respond(404, {"error": "This sign-up no longer exists."})
    attrs = attrs_to_dict(user["UserAttributes"])
    return respond(200, {"name": attrs.get("name", ""), "email": attrs.get("email", ""),
                         "status": attrs.get("custom:approval", "pending")})


def admin_decide(event):
    data = read_json(event)
    username, action = str(data.get("u", "")), data.get("action")
    if not valid_sig(username, data.get("sig", "")):
        return respond(403, {"error": "This approval link is invalid."})
    if action not in ("approve", "deny"):
        return respond(400, {"error": "Unknown action."})
    status = "approved" if action == "approve" else "denied"
    try:
        COGNITO.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID, Username=username,
            UserAttributes=[{"Name": "custom:approval", "Value": status}])
        if status == "denied":  # end any existing sessions immediately
            COGNITO.admin_user_global_sign_out(UserPoolId=USER_POOL_ID, Username=username)
    except COGNITO.exceptions.UserNotFoundException:
        return respond(404, {"error": "This sign-up no longer exists."})
    return respond(200, {"ok": True, "status": status})


# ---------- static web app ----------

def serve_static(event, path):
    target = (WEB / path.lstrip("/")).resolve()
    if not target.is_file() or WEB.resolve() not in target.parents:
        target = WEB / "index.html"  # single-page app: the client-side router handles the path
    ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml"):
        ctype += "; charset=utf-8"
    data = target.read_bytes()
    cache = "public, max-age=31536000, immutable" if "/assets/" in path else "no-cache"
    headers = {"Cache-Control": cache}
    accepts_gzip = "gzip" in str((event.get("headers") or {}).get("accept-encoding", ""))
    if ctype.startswith(TEXT_TYPES) and accepts_gzip and len(data) > 1024:
        data = gzip.compress(data)
        headers["Content-Encoding"] = "gzip"
        headers["Vary"] = "Accept-Encoding"
    elif ctype.startswith(TEXT_TYPES):
        out = respond(200, data.decode("utf-8"), ctype, headers)
        return out
    out = respond(200, base64.b64encode(data).decode(), ctype, headers)
    out["isBase64Encoded"] = True
    return out


# ---------- entry point ----------

def lambda_handler(event, context):
    if "triggerSource" in event:
        return handle_trigger(event)

    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path = event.get("rawPath", "/")

    if path.startswith("/api/"):
        routes = {("POST", "/api/ask"): api_ask,
                  ("GET", "/api/admin/user"): admin_user,
                  ("POST", "/api/admin/decide"): admin_decide}
        handler = routes.get((method, path.rstrip("/")))
        return handler(event) if handler else respond(404, {"error": "Not found."})

    if method == "GET":
        return serve_static(event, path)
    return respond(405, {"error": "Method not allowed."})
