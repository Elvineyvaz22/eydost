"""
Quick test script - verifies the eSIM Access API token works.
Run from backend/ directory: python test_connection.py
"""

import os
import sys
import io

# Fix Windows terminal encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv

load_dotenv()

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from esim_access.service import ESIMService
from esim_access.client import ESIMAccessError

def test():
    print("=" * 50)
    print("  eSIM Access API — Connection Test")
    print("=" * 50)

    try:
        svc = ESIMService()

        # 1. Balance test
        print("\n[1/3] Balans yoxlanılır...")
        balance = svc.get_balance()
        print(f"  ✅ Balans: {balance}")

        # 2. Package list test (Turkey)
        print("\n[2/3] Türkiyə paketləri çəkilir...")
        packages = svc.list_packages(location_code="TR")
        print(f"  ✅ {len(packages)} paket tapıldı")
        if packages:
            p = packages[0]
            print(f"  İlk paket: {p.get('name')} | Qiymət: {p.get('price')} | Kod: {p.get('packageCode')}")

        # 3. Global packages test
        print("\n[3/3] Bütün paketlər sayılır...")
        all_packages = svc.list_packages()
        print(f"  ✅ Cəmi {len(all_packages)} paket mövcuddur")

        print("\n" + "=" * 50)
        print("  🎉 Bütün testlər uğurlu keçdi!")
        print("=" * 50)

    except ESIMAccessError as e:
        print(f"\n  ❌ API Xətası: {e}")
        print(f"     Error Code: {e.error_code}")
        sys.exit(1)
    except Exception as e:
        print(f"\n  ❌ Gözlənilməz xəta: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test()
