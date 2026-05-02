import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from esim_access.whatsapp import send_whatsapp_template

def main():
    load_dotenv()
    
    # You can specify the recipient number here (with country code, e.g., 99450xxxxxxx)
    if len(sys.argv) > 1:
        recipient = sys.argv[1]
    else:
        recipient = input("Recipient phone number (e.g., 994558878889): ") or "994558878889"

    template_name = "appointment_confirmation_1"
    language = "az" # Default to Azerbaijani

    print(f"\nSending template '{template_name}' to {recipient}...")
    
    # Try sending with az first
    success = send_whatsapp_template(recipient, template_name, language)
    
    if success:
        print(f"\n[OK] Template '{template_name}' sent successfully with 'az'!")
    else:
        print(f"\n[INFO] 'az' failed, trying 'en_US'...")
        success = send_whatsapp_template(recipient, template_name, "en_US")
        if success:
             print(f"\n[OK] Template '{template_name}' sent successfully with 'en_US'!")
        else:
            print("\n[ERROR] Template could not be sent. It might require parameters.")
            print("Check the logs/output above for the exact error from Meta API.")

if __name__ == "__main__":
    main()
