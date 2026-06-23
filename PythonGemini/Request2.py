import urllib.request
import re

url = "https://www.tiktok.com/t/ZP8sTckYr/"
req = urllib.request.Request(
    url, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
)

try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8', errors='ignore')
    
    title_match = re.search(r'<meta property="og:title" content="(.*?)"', html)
    desc_match = re.search(r'<meta property="og:description" content="(.*?)"', html)
    
    print("Title:", title_match.group(1) if title_match else 'No title')
    print("Desc:", desc_match.group(1) if desc_match else 'No desc')
    print("Final URL:", response.geturl())
except Exception as e:
    print("Error:", e)
