"""End-to-end tests for the address book."""


def _addr(**kw):
    base = {"phone": "99112233", "city": "Улаанбаатар", "district": "Сүхбаатар"}
    base.update(kw)
    return base


def test_first_address_becomes_default(client, login):
    h = login("+97695100001")
    a = client.post("/addresses", headers=h, json=_addr(label="Гэр", khoroo="1", detail="12 байр")).json()
    assert a["is_default"] is True
    assert a["formatted"] == "Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, 12 байр"


def test_default_switches_and_list_orders_default_first(client, login):
    h = login("+97695100002")
    first = client.post("/addresses", headers=h, json=_addr(label="Гэр")).json()
    second = client.post("/addresses", headers=h, json=_addr(label="Ажил", is_default=True)).json()

    listed = client.get("/addresses", headers=h).json()
    assert listed[0]["id"] == second["id"]  # default first
    assert listed[0]["is_default"] is True
    # only one default at a time
    assert sum(x["is_default"] for x in listed) == 1
    assert next(x for x in listed if x["id"] == first["id"])["is_default"] is False


def test_second_address_does_not_steal_default(client, login):
    h = login("+97695100003")
    first = client.post("/addresses", headers=h, json=_addr(label="Гэр")).json()
    client.post("/addresses", headers=h, json=_addr(label="Ажил")).json()  # is_default defaults False
    listed = {x["id"]: x for x in client.get("/addresses", headers=h).json()}
    assert listed[first["id"]]["is_default"] is True


def test_patch_promotes_to_default(client, login):
    h = login("+97695100004")
    first = client.post("/addresses", headers=h, json=_addr(label="Гэр")).json()
    second = client.post("/addresses", headers=h, json=_addr(label="Ажил")).json()
    client.patch(f"/addresses/{second['id']}", headers=h, json={"is_default": True})
    listed = {x["id"]: x for x in client.get("/addresses", headers=h).json()}
    assert listed[second["id"]]["is_default"] is True
    assert listed[first["id"]]["is_default"] is False


def test_deleting_default_promotes_another(client, login):
    h = login("+97695100005")
    first = client.post("/addresses", headers=h, json=_addr(label="Гэр")).json()
    second = client.post("/addresses", headers=h, json=_addr(label="Ажил", is_default=True)).json()
    client.delete(f"/addresses/{second['id']}", headers=h)
    listed = client.get("/addresses", headers=h).json()
    assert len(listed) == 1
    assert listed[0]["id"] == first["id"]
    assert listed[0]["is_default"] is True


def test_cannot_touch_another_users_address(client, login):
    owner = login("+97695100006")
    addr = client.post("/addresses", headers=owner, json=_addr()).json()
    intruder = login("+97695100007")
    assert client.patch(f"/addresses/{addr['id']}", headers=intruder, json={"city": "x"}).status_code == 404
    assert client.delete(f"/addresses/{addr['id']}", headers=intruder).status_code == 404
    assert client.get("/addresses", headers=intruder).json() == []
