import io
import pytest
from importlib import import_module

app = import_module("app").app


def test_generate_labels_pdf():
    client = app.test_client()
    payload = {
        "labels": [
            {
                "productName": "Test", 
                "batchNumber": "B1", 
                "quantityInBox": "10", 
                "mfgDate": "2024-01", 
                "weightVolume": "50 g", 
                "numberOfStickers": 1
            }
        ]
    }
    resp = client.post('/generate-labels-pdf', json=payload)
    assert resp.status_code == 200
    assert resp.headers['Content-Type'] == 'application/pdf'
    assert len(resp.data) > 100
