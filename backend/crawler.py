import os
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin

def crawl_ftp(source_id: int, source_url: str, on_progress=None):
    """
    Crawls an HTTP server and returns a list of directories found.
    (Function name kept for compatibility, but only does HTTP/HTTPS)
    """
    return crawl_http(source_id, source_url, on_progress)

def crawl_http(source_id: int, start_url: str, on_progress=None):
    found = []
    visited = set()
    queue = [start_url]
    
    # Limit depth or count to avoid infinite loops in this demo
    while queue:
        curr_url = queue.pop(0)
        if curr_url in visited:
            continue
        visited.add(curr_url)
        
        try:
            if on_progress:
                on_progress(len(found), curr_url)
            print(f"Crawling HTTP: {curr_url}")
            res = httpx.get(curr_url, timeout=10)
            if res.status_code != 200:
                continue
                
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Find all links
            for link in soup.find_all('a'):
                href = link.get('href')
                if not href:
                    continue
                    
                # Ignore parent directory links often found in indexes
                if href in ('../', './', '/'):
                     continue
                
                # Check if it looks like a directory (ends with /) or we can try to guess
                # Standard Apache/Nginx indexes usually end links with / for dirs
                full_url = urljoin(curr_url, href)
                
                if href.endswith('/'):
                    # It's a directory
                    # Avoid escaping site
                    if not full_url.startswith(start_url):
                        continue
                        
                    name = href.strip('/')
                    path = urlparse(full_url).path
                    
                    found.append({
                        "source_id": source_id,
                        "name": name,
                        "path": path,
                        "original_link": full_url
                    })
                    queue.append(full_url)
                    
        except Exception as e:
            print(f"Error crawling HTTP {curr_url}: {e}")
            
    return found
