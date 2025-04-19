import sys
import json
from datetime import datetime

def process_invoice(file_path):
    # Basit test verisi döndür
    result = {
        "faturaNo": "TEST-2024-001",
        "faturaTarihi": datetime.now().strftime("%d.%m.%Y"),
        "faturaTipi": "SATIS",
        "tutar": "1250.00",
        "kategori": "TEST"
    }
    return result

def main():
    if len(sys.argv) != 2:
        print("Hata: Dosya yolu belirtilmedi", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        result = process_invoice(file_path)
        # ASCII karakterlerle JSON çıktısı oluştur
        json_str = json.dumps(result, ensure_ascii=True)
        print(json_str)
        sys.exit(0)
    except Exception as e:
        print(f"Hata: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
