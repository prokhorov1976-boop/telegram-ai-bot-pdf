#!/usr/bin/env python3
"""
Скрипт для переиндексации всех PDF документов с новой моделью text-search-doc
Использует функцию process-pdf для каждого документа
"""

import requests
import json

# URL функции process-pdf
PROCESS_PDF_URL = "https://functions.poehali.dev/44b9c312-5377-4fa7-8b4c-522f4bbbf201"

# ID всех документов для переиндексации
document_ids = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

print(f"🚀 Начинаю переиндексацию {len(document_ids)} документов...\n")

results = []
for doc_id in document_ids:
    print(f"📄 Обрабатываю документ ID={doc_id}...", end=" ")
    
    try:
        response = requests.post(
            PROCESS_PDF_URL,
            json={"documentId": doc_id},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ OK ({data.get('chunks', 0)} chunks)")
            results.append({"id": doc_id, "status": "success", "data": data})
        else:
            print(f"❌ ERROR {response.status_code}")
            results.append({"id": doc_id, "status": "error", "error": response.text})
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        results.append({"id": doc_id, "status": "exception", "error": str(e)})

print("\n" + "="*60)
print("📊 РЕЗУЛЬТАТЫ:")
print("="*60)

success = len([r for r in results if r["status"] == "success"])
failed = len(results) - success

print(f"✅ Успешно: {success}/{len(document_ids)}")
print(f"❌ Ошибок: {failed}/{len(document_ids)}")

if failed > 0:
    print("\nОшибки:")
    for r in results:
        if r["status"] != "success":
            print(f"  - ID {r['id']}: {r.get('error', 'Unknown error')}")

print("\n✨ Готово! Все документы переиндексированы с моделью text-search-doc")
