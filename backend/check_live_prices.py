import os
import json
from dotenv import load_dotenv
from esim_access.service import ESIMService

load_dotenv()

def check_prices():
    service = ESIMService()
    groups = service.get_country_groups()
    
    print(f"Type: {type(groups)}")
    print(f"Count: {len(groups)}")
    print(json.dumps(groups, indent=2))

if __name__ == "__main__":
    check_prices()
