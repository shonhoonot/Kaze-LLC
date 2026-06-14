"""Order-event → in-app notification glue.

Centralises status-change side effects so every place that advances an order
also writes a timeline event AND a customer-facing notification with friendly
Mongolian copy.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Notification, Order, OrderEvent, OrderStatus

# Friendly customer-facing copy per status (timeline + notification feed).
STATUS_COPY: dict[OrderStatus, tuple[str, str]] = {
    OrderStatus.PLACED: ("Захиалга баталгаажлаа", "Таны захиалгыг хүлээн авлаа. Төлбөр хийгдсэний дараа боловсруулна."),
    OrderStatus.PAID: ("Төлбөр хүлээн авлаа", "Төлбөр амжилттай. Удахгүй Японд худалдан авалт хийнэ."),
    OrderStatus.PURCHASING_IN_JP: ("Японд худалдан авч байна", "Таны барааг Япон дахь дэлгүүрээс худалдан авч байна."),
    OrderStatus.RECEIVED_AT_JP_WAREHOUSE: ("Япон агуулахад ирлээ", "Бараа Япон дахь агуулахад хүрэлцэн ирлээ."),
    OrderStatus.PACKED: ("Хайрцагт савлагдлаа", "Таны бараа ачааны хайрцагт савлагдсан."),
    OrderStatus.SHIPPED_CARGO: ("Далайн ачаагаар явлаа", "Таны бараа Монгол руу далайн ачаагаар хөдөллөө."),
    OrderStatus.ARRIVED_MN: ("Монголд ирлээ", "Таны бараа Монголд ирж, гаалийн бүрдүүлэлтэд орлоо."),
    OrderStatus.READY_FOR_PICKUP: ("Авахад бэлэн боллоо", "Таны захиалга авахад бэлэн боллоо."),
    OrderStatus.DELIVERED: ("Хүргэгдлээ", "Таны захиалга амжилттай хүргэгдлээ. Баярлалаа!"),
    OrderStatus.CANCELLED: ("Захиалга цуцлагдлаа", "Таны захиалга цуцлагдсан."),
    OrderStatus.REFUNDED: ("Буцаан олголт", "Таны төлбөрийг буцаан олголоо."),
}


def record_order_event(
    db: Session,
    order: Order,
    status: OrderStatus,
    *,
    note: str | None = None,
    notify: bool = True,
) -> None:
    """Append a timeline event and (optionally) a customer notification.

    Caller is responsible for the surrounding commit.
    """
    order.events.append(OrderEvent(status=status, note=note))
    if not notify:
        return
    title, body = STATUS_COPY.get(status, (f"Захиалга #{order.id}", note))
    db.add(
        Notification(
            user_id=order.user_id,
            order_id=order.id,
            title=title,
            body=note or body,
        )
    )
