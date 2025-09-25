let residences = [];

async function loadCSV() {
  const response = await fetch('data/residences.csv');
  const text = await response.text();
  const rows = text.split('\n').slice(1);
  residences = rows.map(row => {
    const [name, address, city, region, phone, email, website, amenities, map, desc, available] = row.split(',');
    return { name, address, city, region, phone, email, website, amenities, map, desc, available };
  });
  displayResults(residences);
}

function applyFilters() {
  const region = document.getElementById('regionFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();
  const amenityFilters = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

  const filtered = residences.filter(r => {
    const matchesRegion = !region || r.region === region;
    const matchesSearch = r.name.toLowerCase().includes(search) || r.city.toLowerCase().includes(search);
    const matchesAmenities = amenityFilters.every(a => r.amenities.includes(a));
    return matchesRegion && matchesSearch && matchesAmenities;
  });

  displayResults(filtered);
}

function displayResults(list) {
  const container = document.getElementById('results');
  container.innerHTML = '';
  list.forEach(r => {
    container.innerHTML += `
      <div class="card">
        <h2>${r.name}</h2>
        <p>${r.address}, ${r.city}</p>
        <p>Phone: ${r.phone} | Email: <a href="mailto:${r.email}">${r.email}</a></p>
        <p><a href="${r.website}" target="_blank">Visit Website</a></p>
        <div class="amenities">${r.amenities.split(',').map(a => `<span>${a}</span>`).join('')}</div>
        <p>${r.desc}</p>
        <a class="contact-btn" href="mailto:${r.email}?subject=Inquiry about ${r.name}">Contact</a>
        <p><a href="${r.map}" target="_blank">View on Map</a></p>
      </div>
    `;
  });
}

loadCSV();