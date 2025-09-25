let residences = [];
let filteredResults = [];
let currentPage = 1;
let pageSize = 10;
let sortConfig = { key: null, direction: 'asc' };

window.addEventListener('DOMContentLoaded', () => {
  fetch('residences.xlsx')
    .then(res => res.arrayBuffer())
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
      filteredResults = [...residences];
      renderTable();
    });

  document.getElementById('regionFilter').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.querySelectorAll('.filters input[type="checkbox"]').forEach(cb =>
    cb.addEventListener('change', applyFilters)
  );
  document.getElementById('pageSize').addEventListener('change', e => {
    pageSize = parseInt(e.target.value) || 10;
    currentPage = 1;
    renderTable();
  });
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredResults.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
  document.querySelectorAll('th[data-key]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-key');
      if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
      }
      renderTable();
    });
  });
  document.getElementById('exportBtn').addEventListener('click', exportToExcel);
});

function applyFilters() {
  const region = document.getElementById('regionFilter').value.toLowerCase();
  const search = document.getElementById('searchInput').value.toLowerCase();
  const amenityFilters = Array.from(document.querySelectorAll('.filters input[type="checkbox"]:checked')).map(cb => cb.value.toLowerCase());

  filteredResults = residences.filter(r => {
    const matchesRegion = !region || r.region.toLowerCase() === region;
    const matchesSearch = !search || r.name.toLowerCase().includes(search) || r.address.toLowerCase().includes(search);
    const matchesAmenities = amenityFilters.length === 0 || amenityFilters.every(a => r.amenities.toLowerCase().includes(a));
    return matchesRegion && matchesSearch && matchesAmenities;
  });

  currentPage = 1;
  renderTable();
}

function sortData(data) {
  if (!sortConfig.key) return data;
  return [...data].sort((a, b) => {
    const valA = a[sortConfig.key]?.toLowerCase() || '';
    const valB = b[sortConfig.key]?.toLowerCase() || '';
    return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
}

function renderTable() {
  const tbody = document.getElementById('directoryBody');
  tbody.innerHTML = '';

  const sorted = sortData(filteredResults);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const pageData = sorted.slice(start, start + pageSize);

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No residences match your filters.</td></tr>`;
    document.getElementById('pageInfo').textContent = '';
    return;
  }

  pageData.forEach(r => {
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

  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
}

function exportToExcel() {
  const sheet = XLSX.utils.json_to_sheet(filteredResults);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Directory");
  XLSX.writeFile(wb, "filtered_directory.xlsx");
}
