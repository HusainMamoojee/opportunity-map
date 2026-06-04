import os
import requests
from bs4 import BeautifulSoup
import json

# 1. The target website
TARGET_URL = 'https://www.graduates24.com/graduate_programmes'

# 2. Our mini-geocoder (This was the missing piece!)
COORDINATES = {
    "Johannesburg": {"lng": 28.0473, "lat": -26.2041},
    "Sandton": {"lng": 28.0567, "lat": -26.1076},
    "Pretoria": {"lng": 28.2293, "lat": -25.7479},
    "Cape Town": {"lng": 18.4232, "lat": -33.9249},
    "Secunda": {"lng": 29.1895, "lat": -26.5161},
    "South Africa": {"lng": 28.0473, "lat": -26.2041} # Default fallback
}

def get_coordinates(location_string):
    """Converts a text location into map coordinates."""
    for city, coords in COORDINATES.items():
        if city.lower() in location_string.lower():
            return coords
    return {"lng": 28.0473, "lat": -26.2041}

def scrape_opportunities():
    print(f"Scanning the radar at: {TARGET_URL}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(TARGET_URL, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    scraped_data = []
    
    # Find all links on the page
    job_links = soup.find_all('a', href=True)
    
    job_id = 1
    for link in job_links:
        title = link.text.strip()
        title_lower = title.lower() # Convert to lowercase for easy matching!
        
        # Filter: Broader and case-insensitive
        if len(title) > 8 and ("programme" in title_lower or "graduate" in title_lower or "intern" in title_lower):
            
            # Guess the company (usually the first word)
            company = title.split(' ')[0]
            
            # Check for locations
            location = "South Africa"
            if "johannesburg" in title_lower or "jhb" in title_lower: location = "Johannesburg"
            elif "pretoria" in title_lower or "pta" in title_lower: location = "Pretoria"
            elif "cape town" in title_lower or "cpt" in title_lower: location = "Cape Town"
            elif "sandton" in title_lower: location = "Sandton"
            
            coords = get_coordinates(location)
            
            opportunity = {
                "id": job_id,
                "title": title,
                "company": company,
                "type": "GRADUATE",
                "location": location,
                "lng": coords["lng"],
                "lat": coords["lat"],
                "tag": "NEW",
                "sector": "Corporate"
            }
            scraped_data.append(opportunity)
            job_id += 1
            
            # Let's grab the first 12 valid jobs we find
            if job_id > 12:
                break
                
    return scraped_data

def save_to_json(data):
    if not data:
        print("No jobs found! The website HTML might have changed.")
        return
        
    # Dynamically find the public folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(script_dir, '..', 'public')
    file_path = os.path.join(public_dir, 'opportunities.json')
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully saved {len(data)} opportunities to: {file_path}")

# Run the script
if __name__ == "__main__":
    # We now run the actual scraper and pass the LIVE data to be saved!
    live_data = scrape_opportunities()
    save_to_json(live_data)