import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://developers.mitgo.com/hc/en-us/articles/34481290690834-Introduction',
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'sec-ch-ua': '"Chromium";v="125", "Google Chrome";v="125"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
    }
)

try:
    response = urllib.request.urlopen(req, context=ctx, timeout=20)
    content = response.read().decode('utf-8', errors='ignore')
    print(f"Response length: {len(content)}")
    print(f"Content-Type: {response.headers.get('Content-Type', 'unknown')}")
    
    # Remove scripts and styles
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL)
    
    # Print raw HTML around "Introduction"
    idx = content.find('Introduction')
    if idx > 0:
        print("\n=== AROUND 'Introduction' ===")
        print(content[max(0,idx-500):idx+5000])
    
    # Print all text content
    text = re.sub(r'<[^>]+>', ' ', content)
    text = re.sub(r'\s+', ' ', text).strip()
    print("\n=== CLEANED TEXT ===")
    print(text[:8000])
    
except Exception as e:
    print(f"ERROR: {e}")
