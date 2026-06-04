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
// 3. THE DUMMY DATABASE
// ==========================================
const opportunities = [
    {
        id: 1, title: "Data Science Graduate Programme", company: "Standard Bank Group", type: "INTERNSHIP", 
        location: "Johannesburg", lng: 28.0473, lat: -26.2041, tag: "NEW", sector: "Tech"
    },
    {
        id: 2, title: "Software Engineering Bursary", company: "Retro Rabbit", type: "BURSARY", 
        location: "Pretoria", lng: 28.2293, lat: -25.7479, tag: "CLOSING SOON", sector: "Tech"
    },
    {
        id: 3, title: "Junior Financial Analyst", company: "Investec", type: "ENTRY LEVEL", 
        location: "Sandton", lng: 28.0567, lat: -26.1076, tag: "HOT MATCH", sector: "Finance"
    },
    {
        id: 4, title: "Mechanical Engineering Learnership", company: "Sasol", type: "LEARNERSHIP", 
        location: "Secunda", lng: 29.1895, lat: -26.5161, tag: "NEW", sector: "Engineering"
    }
];

// ==========================================
// 4. MAP & RENDER LOGIC
// (Wrapped in an IF statement so it only runs on the Map page)
// ==========================================
if (document.getElementById('map') && document.getElementById('opportunities-list')) {
    
    // Initialize the MapLibre Engine
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [28.0473, -26.2041],
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

    // Initial Load
    renderData(opportunities);

    // Filter Logic
    const filterButtons = document.querySelectorAll('.filter-scroll button');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            
            filterButtons.forEach(btn => {
                btn.classList.remove('btn-primary', 'fw-medium');
                btn.classList.add('pill-inactive');
            });
            e.target.classList.remove('pill-inactive');
            e.target.classList.add('btn-primary', 'fw-medium');

            const selectedSector = e.target.innerText.trim(); 
            let filteredArray = opportunities; 
            
            if (selectedSector !== "All Fields") {
                filteredArray = opportunities.filter(opp => opp.sector === selectedSector);
            }
            renderData(filteredArray);
        });
    });
}