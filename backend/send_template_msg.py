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

    template_name = "dsdsdsd"
    language = "az" # Default to Azerbaijani as the user is likely Azerbaijani

    print(f"\nSending template '{template_name}' to {recipient}...")
    success = send_whatsapp_template(recipient, template_name, language)
    
    if success:
        print("\n[OK] Template sent successfully with 'az'!")
    else:
        print("\n[INFO] 'az' failed, trying 'en_US' with 2 parameters...")
        # Template requires 2 body parameters and 1 button parameter based on previous errors
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": "Test Param 1"},
                    {"type": "text", "text": "Test Param 2"}
                ]
            },
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {"type": "text", "text": "test-slug"}
                ]
            }
        ]
        success = send_whatsapp_template(recipient, template_name, "en_US", components)
        if success:
             print("\n[OK] Template sent successfully with 'en_US' and all parameters!")
        else:
            print("\n[ERROR] Template could not be sent. Please check template name and language.")

if __name__ == "__main__":
    main()
