"""File storage for uploaded images — local disk or Azure Blob.

The backend is chosen by `settings.storage_backend`. Local returns a
`/uploads/<name>` URL served by StaticFiles; Azure returns the blob URL.
"""
from __future__ import annotations

import os
import uuid

from app.config import settings

ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

MAX_BYTES = 5 * 1024 * 1024  # 5 MB


class UploadError(ValueError):
    """Raised when an upload is rejected (bad type / too large)."""


def _new_name(content_type: str) -> str:
    return f"{uuid.uuid4().hex}{ALLOWED_TYPES[content_type]}"


def save_image(data: bytes, content_type: str) -> str:
    """Persist image bytes and return a public URL. Raises UploadError if invalid."""
    if content_type not in ALLOWED_TYPES:
        raise UploadError("Зөвхөн JPG, PNG, WEBP, GIF зураг оруулна уу")
    if len(data) > MAX_BYTES:
        raise UploadError("Зургийн хэмжээ 5MB-аас хэтэрсэн байна")
    if not data:
        raise UploadError("Хоосон файл")

    name = _new_name(content_type)

    if settings.storage_backend == "azure":
        return _save_azure(name, data, content_type)
    return _save_local(name, data)


def _save_local(name: str, data: bytes) -> str:
    os.makedirs(settings.upload_dir, exist_ok=True)
    with open(os.path.join(settings.upload_dir, name), "wb") as fh:
        fh.write(data)
    return f"/uploads/{name}"


def _save_azure(name: str, data: bytes, content_type: str) -> str:
    try:
        from azure.storage.blob import BlobServiceClient, ContentSettings
    except ImportError as exc:
        raise UploadError("Azure сан суулгагдаагүй байна") from exc
    client = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
    container = client.get_container_client(settings.azure_storage_container)
    blob = container.upload_blob(
        name=name,
        data=data,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    return blob.url
