from datetime import datetime, timezone
from typing import Optional, Any
from bson import ObjectId


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"Invalid ObjectId: {id_str}")


def serialize_doc(doc: dict) -> dict:
    """Recursively convert ObjectId to string in a document."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(v) if isinstance(v, dict) else (str(v) if isinstance(v, ObjectId) else v)
                for v in value
            ]
        else:
            result[key] = value
    return result


def format_currency(amount: float) -> str:
    """Format amount as Indian currency string."""
    return f"₹{amount:,.2f}"


def generate_receipt_number(sequence: int) -> str:
    return f"REC-{datetime.now().year}-{sequence:05d}"


def generate_maintenance_number(sequence: int) -> str:
    return f"MR-{sequence:04d}"
