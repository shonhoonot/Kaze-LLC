"""Verify Google Sign-In ID tokens.

Used by POST /auth/google. The Google libraries are imported lazily so the
app still boots if the dependency is missing or the feature is unconfigured.
"""
from __future__ import annotations

from app.config import settings


class GoogleAuthError(ValueError):
    """Raised when a Google ID token cannot be verified."""


def verify_google_token(id_token: str) -> dict:
    """Validate the ID token against Google and return the claims we need.

    Returns a dict with: sub, email, email_verified, name, picture.
    Raises GoogleAuthError on any verification failure.
    """
    if not settings.google_client_id:
        raise GoogleAuthError("Google нэвтрэлт тохируулагдаагүй байна")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token
    except ImportError as exc:  # dependency not installed
        raise GoogleAuthError("Google сан суулгагдаагүй байна") from exc

    try:
        claims = google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError as exc:
        raise GoogleAuthError("Google токен хүчингүй байна") from exc

    if not claims.get("email"):
        raise GoogleAuthError("Google бүртгэлд и-мэйл алга")

    return {
        "sub": claims.get("sub"),
        "email": claims["email"].lower(),
        "email_verified": bool(claims.get("email_verified")),
        "name": claims.get("name"),
        "picture": claims.get("picture"),
    }
