"""End-to-end tests for the contact form + admin handling."""


def test_anonymous_can_submit(client):
    res = client.post("/contact", json={"name": "Зочин", "contact": "99112233", "message": "Сайн уу?"})
    assert res.status_code == 201
    body = res.json()
    assert body["handled"] is False
    assert body["user_id"] is None
    assert body["contact"] == "99112233"


def test_validation_requires_contact_and_message(client):
    assert client.post("/contact", json={"contact": "", "message": "x"}).status_code == 400
    assert client.post("/contact", json={"contact": "a@b.mn", "message": "  "}).status_code == 400


def test_logged_in_submission_links_user(client, login):
    h = login("+97696200001", "Болд")
    res = client.post("/contact", headers=h, json={"contact": "a@b.mn", "message": "Захиалга асуух"}).json()
    assert res["user_id"] is not None
    assert res["name"] == "Болд"  # falls back to the account name


def test_admin_lists_and_marks_handled(client, admin_headers):
    created = client.post("/contact", json={"contact": "99000000", "message": "Тест"}).json()
    # appears under unhandled
    unhandled = client.get("/admin/contact?handled=false", headers=admin_headers).json()
    assert any(m["id"] == created["id"] for m in unhandled)
    # mark handled
    upd = client.patch(f"/admin/contact/{created['id']}", headers=admin_headers, json={"handled": True}).json()
    assert upd["handled"] is True
    handled = client.get("/admin/contact?handled=true", headers=admin_headers).json()
    assert any(m["id"] == created["id"] for m in handled)


def test_admin_only(client, login):
    h = login("+97696200002")
    assert client.get("/admin/contact", headers=h).status_code == 403
