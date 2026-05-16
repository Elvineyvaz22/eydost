"""Tests for safe eSIM package sync behavior."""

import pytest

import sync_packages


class Response:
    def __init__(self, data=None):
        self.data = data or []


class FakeSupabase:
    def __init__(self, records, fail_upsert=False):
        self.records = records
        self.fail_upsert = fail_upsert
        self.upsert_conflicts = []
        self.updates = []

    def table(self, name):
        assert name == "esim_packages"
        return FakeQuery(self)


class FakeQuery:
    def __init__(self, db):
        self.db = db
        self.operation = None
        self.payload = None
        self.filters = []
        self.on_conflict = None

    def select(self, fields):
        self.operation = "select"
        self.payload = fields
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def upsert(self, payload, on_conflict=None):
        self.operation = "upsert"
        self.payload = payload
        self.on_conflict = on_conflict
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def execute(self):
        if self.operation == "upsert":
            self.db.upsert_conflicts.append(self.on_conflict)
            if self.db.fail_upsert:
                raise RuntimeError("upsert failed")

            key = (self.payload["country_code"], self.payload["package_code"])
            for record in self.db.records:
                if (record["country_code"], record["package_code"]) == key:
                    record.update(self.payload)
                    return Response()

            self.db.records.append(dict(self.payload))
            return Response()

        matching = [record for record in self.db.records if self._matches(record)]
        if self.operation == "select":
            fields = [field.strip() for field in self.payload.split(",")]
            return Response([{field: record.get(field) for field in fields} for record in matching])

        if self.operation == "update":
            self.db.updates.append((dict(self.payload), list(self.filters)))
            for record in matching:
                record.update(self.payload)
            return Response()

        raise AssertionError(f"Unexpected operation: {self.operation}")

    def _matches(self, record):
        return all(record.get(field) == value for field, value in self.filters)


def package_record(country_code, package_code, is_active=True):
    return {
        "country_code": country_code,
        "package_code": package_code,
        "slug": package_code,
        "name": f"{country_code} {package_code}",
        "volume_bytes": 1024**3,
        "duration_days": 7,
        "sell_price_minor": 10000,
        "currency_code": "AZN",
        "is_unlimited": False,
        "speed": "4G",
        "description": "",
        "is_active": is_active,
    }


def test_sync_country_does_not_deactivate_existing_packages_when_upsert_fails(monkeypatch):
    existing = package_record("TR", "OLD")
    db = FakeSupabase([existing], fail_upsert=True)
    monkeypatch.setattr(sync_packages, "get_packages_for_country", lambda country: [package_record(country, "NEW")])

    with pytest.raises(RuntimeError):
        sync_packages.sync_country(db, "TR")

    assert existing["is_active"] is True
    assert db.updates == []


def test_sync_country_deactivates_stale_packages_after_successful_upserts(monkeypatch):
    old = package_record("TR", "OLD")
    current = package_record("TR", "CURRENT")
    db = FakeSupabase([old, current])
    monkeypatch.setattr(sync_packages, "get_packages_for_country", lambda country: [package_record(country, "CURRENT")])

    assert sync_packages.sync_country(db, "TR") == 1

    assert current["is_active"] is True
    assert old["is_active"] is False
    assert db.upsert_conflicts == ["country_code,package_code"]


def test_sync_country_preserves_existing_packages_when_no_records_return(monkeypatch):
    existing = package_record("TR", "OLD")
    db = FakeSupabase([existing])
    monkeypatch.setattr(sync_packages, "get_packages_for_country", lambda country: [])

    assert sync_packages.sync_country(db, "TR") == 0

    assert existing["is_active"] is True
    assert db.updates == []
