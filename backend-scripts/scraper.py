import os
import requests
from bs4 import BeautifulSoup
import json

# Target the main Graduates24 list
TARGET_URL = 'https://www.graduates24.com/graduate_programmes'

COORDINATES = {
    "Johannesburg": {"lng": 28.0473, "lat": -26.2041},
    "Sandton": {"lng": 28.0567, "lat": -26.1076},
    "Pretoria": {"lng": 28.2293, "lat": -25.7479},
    "Cape Town": {"lng": 18.4232, "lat": -33.9249},
    "Durban": {"lng": 31.0218, "lat": -29.8587},
    "South Africa": {"lng": 28.0473, "lat": -26.2041} # Default fallback
}

def get_coordinates(location_string):
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
    job_links = soup.find_all('a', href=True)
    
    job_id = 1
    for link in job_links:
        # 1. Clean up the text and remove the "New" badge
        raw_text = link.get_text(separator=' ').replace(" New", "").strip()
        
        # 2. CRUSH SPACES: Fixes the hidden space bug
        title = " ".join(raw_text.split()) 
        title_lower = title.lower() 
        
        keywords = ["programme", "graduate", "intern", "learnership", "bursary", "trainee"]
        
        # 3. JUNK FILTER: Ignore short titles, menu items, or categories
        is_category_link = len(title) < 20 or (any(word.isdigit() for word in title.split()) and len(title) < 30)
        
        if not is_category_link and any(keyword in title_lower for keyword in keywords):
            
            # Smarter Company Name Extraction
            if ":" in title:
                company = title.split(':')[0].strip()
            elif "-" in title:
                company = title.split('-')[0].strip()
            else:
                words = title.split(' ')
                company = " ".join(words[:2]) if len(words) >= 2 else words[0]
            
            # Location Checking (Expanded for better accuracy)
            location = "South Africa"
            if "johannesburg" in title_lower or "jhb" in title_lower or "gauteng" in title_lower: location = "Johannesburg"
            elif "pretoria" in title_lower or "pta" in title_lower or "tshwane" in title_lower: location = "Pretoria"
            elif "cape town" in title_lower or "cpt" in title_lower or "western cape" in title_lower: location = "Cape Town"
            elif "sandton" in title_lower: location = "Sandton"
            elif "durban" in title_lower or "dbn" in title_lower or "kzn" in title_lower: location = "Durban"
            
            # Dynamic Job Types
            job_type = "ENTRY LEVEL"
            if "intern" in title_lower: job_type = "INTERNSHIP"
            elif "bursary" in title_lower: job_type = "BURSARY"
            elif "learnership" in title_lower: job_type = "LEARNERSHIP"
            elif "graduate" in title_lower or "programme" in title_lower: job_type = "GRADUATE"
            
            coords = get_coordinates(location)
            
            opportunity = {
                "id": job_id,
                "title": title,
                "company": company,
                "type": job_type,
                "location": location,
                "lng": coords["lng"],
                "lat": coords["lat"],
                "tag": "NEW",
                "sector": "All Fields" 
            }
            
            # Prevent Duplicates
            if not any(opp['title'] == title for opp in scraped_data):
                scraped_data.append(opportunity)
                job_id += 1
                
    return scraped_data

def save_to_json(data):
    if not data:
        print("No jobs found! The website HTML might have changed.")
        return
        
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(script_dir, '..', 'public')
    file_path = os.path.join(public_dir, 'opportunities.json')
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully saved {len(data)} opportunities to: {file_path}")

if __name__ == "__main__":
    live_data = scrape_opportunities()
    save_to_json(live_data)