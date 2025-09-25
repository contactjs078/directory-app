let residences = [];

window.addEventListener('DOMContentLoaded', () => {
  fetch('public/residences.xlsx')
    .then(res => {
      if (!res.ok) throw new Error("Failed to load Excel file");
      return res.arrayBuffer();
    })
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      residences = jsonData.map(r => ({
        name: r['Residence Name'] || '',
        address: `${r['Address'] || ''}, ${r['City'] || ''}`,
        region: r['Region'] || '',
        phone: r['Phone Number'] || '',
        email: r['Email'] || '',
        website: r['Website'] || '',
        amenities: r['Amenities'] || '',
        map: r['Google Maps Link'] || '',
        desc: r['Description'] || '',
        available: r['Available Units'] || ''
      }));
      displayResults(residences); // Show all by default
    })
    .catch(err => {
      console.error("Error loading Excel file:", err);
      document.getElementById('directoryBody').innerHTML = `<tr><td colspan="8">Failed to load directory data.</td></tr>`;
    });

  document.getElementById('regionFilter').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.querySelectorAll('.filters input[type="checkbox"]').forEach(cb =>
    cb.addEventListener('change', applyFilters)
  );
});

function applyFilters() {
  const region = document.getElementById('regionFilter').value.toLowerCase();
  const search = document.getElementById('searchInput').value.toLowerCase();
  const amenityFilters = Array.from(document.querySelectorAll('.filters input[type="checkbox"]:checked')).map(cb => cb.value.toLowerCase());

  const filtered = residences.filter(r => {
    const matchesRegion = !region || r.region.toLowerCase() === region;
    const matchesSearch = !search || r.name.toLowerCase().includes(search) || r.address.toLowerCase().includes(search);
    const matchesAmenities = amenityFilters.length === 0 || amenityFilters.every(a => r.amenities.toLowerCase().includes(a));
    return matchesRegion && matchesSearch && matchesAmenities;
  });

  displayResults(filtered);
}

function displayResults(list) {
  const tbody = document.getElementById('directoryBody');
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No residences match your filters.</td></tr>`;
    return;
  }

  list.forEach(r => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${r.name}</td>
      <td>${r.address}</td>
      <td>${r.phone}</td>
      <td><a href="mailto:${r.email}">${r.email}</a></td>
      <td><a href="${r.website}" target="_blank">${r.website}</a></td>
      <td>${r.amenities}</td>
      <td>${r.desc}</td>
      <td><a href="${r.map}" target="_blank">View Map</a></td>
    `;
    tbody.appendChild(row);
  });
}
