import urllib.request
from bs4 import BeautifulSoup
import json

url = "https://www.tiktok.com/t/ZP8sTckYr/"
req = urllib.request.Request(
    url, 
    data=None, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
)

try:
    response = urllib.request.urlopen(req)
    html = response.read()
    soup = BeautifulSoup(html, 'html.parser')
    
    title = soup.find('meta', property='og:title')
    desc = soup.find('meta', property='og:description')
    
    print("Title:", title['content'] if title else 'No title')
    print("Desc:", desc['content'] if desc else 'No desc')
    
    # Try finding the video ID to resolve the redirect
    print("Final URL:", response.geturl())
except Exception as e:
    print("Error:", e)
