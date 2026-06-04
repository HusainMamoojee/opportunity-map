// ==========================================
// 1. IMPORTS
// ==========================================
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ==========================================
// 2. UNIVERSAL LOGIC: MOBILE MENU
// ==========================================
const menuBtn = document.getElementById('mobile-menu-btn');
const closeBtn = document.getElementById('close-menu-btn');
const sidebar = document.getElementById('left-sidebar');

if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.remove('d-none');
        sidebar.classList.add('mobile-sidebar-active');
    });
}

if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
        sidebar.classList.add('d-none');
        sidebar.classList.remove('mobile-sidebar-active');
    });
}

// ==========================================
// 3. MAP & RENDER LOGIC
// (Wrapped in an IF statement so it only runs on the Map page)
// ==========================================
if (document.getElementById('map') && document.getElementById('opportunities-list')) {
    
    // Initialize the MapLibre Engine
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [28.0473, -26.2041], // Centered on South Africa
        zoom: 5,
        attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const listContainer = document.getElementById('opportunities-list');
    let activeMarkers = []; 

    // Function to draw cards and markers
    function renderData(dataToRender) {
        
        // Clear old markers
        activeMarkers.forEach(marker => marker.remove());
        activeMarkers = []; 

        // Clear old HTML
        listContainer.innerHTML = '';

        dataToRender.forEach(opp => {
            // Draw Map Marker
            const marker = new maplibregl.Marker({ color: "#0052FF" })
                .setLngLat([opp.lng, opp.lat])
                .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<strong style="color: #0F172A;">${opp.title}</strong><br><span style="color: #64748B;">${opp.company}</span>`))
                .addTo(map);
            
            activeMarkers.push(marker);

            // Badge Colors
            let badgeBgColor = "var(--radar-teal)"; 
            let badgeTextColor = "text-dark";
            if (opp.tag === "CLOSING SOON") { badgeBgColor = "#ef4444"; badgeTextColor = "text-white"; } 
            else if (opp.tag === "HOT MATCH") { badgeBgColor = "#f59e0b"; badgeTextColor = "text-white"; }

            // Inject HTML
            const cardHTML = `
              <div class="card custom-op-card p-2 border-0 opportunity-card" data-lng="${opp.lng}" data-lat="${opp.lat}">
                <div class="card-body">
                  <span class="badge ${badgeTextColor} mb-2" style="background-color: ${badgeBgColor};">${opp.tag}</span> 
                  <span class="badge bg-light text-dark border mb-2">${opp.type}</span>
                  <h6 class="card-title fw-bold mt-1" style="color: var(--text-main);">${opp.title}</h6>
                  <p class="card-text text-secondary small m-0">${opp.company}</p>
                  <p class="card-text text-secondary small mt-3">📍 ${opp.location}</p>
                </div>
              </div>
            `;
            listContainer.innerHTML += cardHTML;
        });

        // Add Click Listeners for the FlyTo Animation
        const cardElements = document.querySelectorAll('.opportunity-card');
        cardElements.forEach(card => {
            card.addEventListener('click', function() {
                const targetLng = parseFloat(this.getAttribute('data-lng'));
                const targetLat = parseFloat(this.getAttribute('data-lat'));
                map.flyTo({ center: [targetLng, targetLat], zoom: 13, speed: 1.2, curve: 1.42, essential: true });
            });
        });
    }

    // ==========================================
    // 4. FETCH LIVE DATA
    // ==========================================
    let liveOpportunities = []; 

    fetch('/opportunities.json')
        .then(response => {
            if (!response.ok) throw new Error("Could not load data");
            return response.json();
        })
        .then(data => {
            liveOpportunities = data; 
            renderData(liveOpportunities); 
        })
        .catch(error => {
            console.error("Error fetching opportunities:", error);
            listContainer.innerHTML = '<p class="p-3 text-muted">Failed to load opportunities. Please try again later.</p>';
        });

    // ==========================================
    // 5. FILTER LOGIC
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-scroll button');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            
            // UI Button toggling
            filterButtons.forEach(btn => {
                btn.classList.remove('btn-primary', 'fw-medium');
                btn.classList.add('pill-inactive');
            });
            e.target.classList.remove('pill-inactive');
            e.target.classList.add('btn-primary', 'fw-medium');

            // Actual Filtering
            const selectedSector = e.target.innerText.trim(); 
            let filteredArray = liveOpportunities; 
            
            if (selectedSector !== "All Fields") {
                filteredArray = liveOpportunities.filter(opp => opp.sector === selectedSector);
            }
            renderData(filteredArray);
        });
    });
}

// ==========================================
// 6. AI CV SCANNER LOGIC
// (Only runs on the scanner.html page)
// ==========================================
if (document.getElementById('cv-input') && document.getElementById('scan-btn')) {
    
    const scanBtn = document.getElementById('scan-btn');
    const cvInput = document.getElementById('cv-input');
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('results-container');

    scanBtn.addEventListener('click', async () => {
        const cvText = cvInput.value.trim();
        
        if (!cvText) {
            alert("Please paste your CV text before scanning.");
            return;
        }

        // 1. Update UI to show loading
        scanBtn.disabled = true;
        resultsContainer.innerHTML = '';
        loadingState.classList.remove('d-none');

        try {
            // 2. Fetch the live jobs database
            const jobsResponse = await fetch('/opportunities.json');
            const jobsData = await jobsResponse.json();

            // 3. Send CV and Jobs to your secure Vercel API
            const matchResponse = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvText: cvText, jobs: jobsData })
            });

            if (!matchResponse.ok) {
                throw new Error("API request failed");
            }

            const matches = await matchResponse.json();

            // 4. Hide loading and render results
            loadingState.classList.add('d-none');
            
            matches.forEach(match => {
                // Find the full job data using the ID returned by the AI
                const jobDetails = jobsData.find(j => j.id === match.id);
                
                if (jobDetails) {
                    const matchCard = `
                        <div class="card border-0 shadow-sm p-4 mb-3" style="border-radius: 12px; border-left: 5px solid #0052FF !important;">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="fw-bold text-dark m-0">${jobDetails.title}</h5>
                                <span class="badge bg-success" style="font-size: 14px;">${match.percentage}% Match</span>
                            </div>
                            <p class="text-secondary fw-medium mb-3">${jobDetails.company} • 📍 ${jobDetails.location}</p>
                            <div class="p-3 bg-light rounded text-dark small">
                                <strong>AI Insight:</strong> ${match.reason}
                            </div>
                        </div>
                    `;
                    resultsContainer.innerHTML += matchCard;
                }
            });

        } catch (error) {
            console.error("Scanning Error:", error);
            loadingState.classList.add('d-none');
            resultsContainer.innerHTML = `<p class="text-danger text-center">An error occurred while analyzing your CV. Please try again.</p>`;
        } finally {
            scanBtn.disabled = false;
        }
    });
}