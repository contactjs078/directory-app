let residences = [];
let filteredResults = [];
let currentPage = 1;
let pageSize = 5;
let sortConfig = { key: null, direction: 'asc' };
let viewMode = 'card';

window.addEventListener('DOMContentLoaded', () => {

  // Close popup
  document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('popupOverlay').style.display = 'none';
  });

  // Load residences.xlsx
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
        map: r['Google Maps Link'] || ''
      }));

      filteredResults = [...residences];
      renderTable();
    });

  // Load amenities.xlsx dynamically
  fetch('amenities.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const container = document.getElementById('amenitiesContainer');
      container.innerHTML = '';

      jsonData.forEach(row => {
        const amenity = row['Amenity'] || Object.values(row)[0];
        if (amenity) {
          const label = document.createElement('label');
          label.innerHTML = `<input type="checkbox" value="${amenity}" /> ${amenity}`;
          container.appendChild(label);
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
        
      document.querySelectorAll('#amenitiesContainer input[type="checkbox"]').forEach(cb =>
        cb.addEventListener('change', applyFilters)
      );
    });

  // Load region.xlsx dynamically
  fetch('region.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const regionSelect = document.getElementById('regionFilter');
      jsonData.forEach(row => {
        const region = row['Region'] || Object.values(row)[0];
        if (region) {
          const option = document.createElement('option');
          option.value = region;
          option.textContent = region;
          regionSelect.appendChild(option);
        }
      });

      regionSelect.addEventListener('change', applyFilters);
    });

  // Other filters and controls
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  const addrEl = document.getElementById('addressSearch');
  if (addrEl) addrEl.addEventListener('input', applyFilters);

  const nameEl = document.getElementById('nameSearch');
  if (nameEl) nameEl.addEventListener('input', applyFilters);


  document.getElementById('pageSize').addEventListener('change', e => {
    pageSize = parseInt(e.target.value) || 5;
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

  document.getElementById('clearAmenities').addEventListener('click', () => {
    document.querySelectorAll('#amenitiesContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
    applyFilters();
  });

  document.querySelectorAll('input[name="viewMode"]').forEach(radio =>
    radio.addEventListener('change', e => {
      viewMode = e.target.value;
      renderTable();
    })
  );

  document.getElementById('exportBtn').addEventListener('click', exportToExcel);
  document.getElementById('printBtn').addEventListener('click', printView);
  const pdfBtn = document.getElementById('pdfBtn');
  if (pdfBtn) pdfBtn.addEventListener('click', exportToPDF);

});
// namebar tirth
function applyFilters() {
  const region = document.getElementById('regionFilter').value.toLowerCase();
  const addressSearch = (document.getElementById('addressSearch')?.value || '').toLowerCase().trim();
  const nameSearch    = (document.getElementById('nameSearch')?.value || '').toLowerCase().trim();

  const rawSearch = document.getElementById('searchInput').value.toLowerCase().trim(); //added those two lines for varun dual search
  const searchTokens = rawSearch ? rawSearch.split(/[\s,]+/).filter(Boolean) : []; //this two lines for varun dual search

  const amenityFilters = Array.from(document.querySelectorAll('#amenitiesContainer input[type="checkbox"]:checked'))
    .map(cb => cb.value.toLowerCase());

  filteredResults = residences.filter(r => {
    const rName = (r.name || '').toLowerCase();
    const rRegion = (r.region || '').toLowerCase();
    const rAmenities = (r.amenities || '').toLowerCase();

    // Region match
    const matchesRegion = !region || (r.region && r.region.toLowerCase() === region);
    const matchesName    = !nameSearch    || (r.name    && r.name.toLowerCase().includes(nameSearch));
    const matchesAddress = !addressSearch || (r.address && r.address.toLowerCase().includes(addressSearch));

    // Keyword match across multiple fields  Varun Dual Search
    const combined = [
      r.name,
      r.address,
      r.region,
      r.amenities,
      r.desc,
      r.details,
    ].filter(Boolean).join(' ').toLowerCase();

    const matchesSearch = searchTokens.length === 0 ||
      searchTokens.every(t => combined.includes(t));


    // Amenity match: all selected amenities must be present
    const matchesAmenities = amenityFilters.length === 0 ||
      amenityFilters.every(a => rAmenities.includes(a));

    return matchesRegion && matchesName && matchesAddress && matchesSearch && matchesAmenities;

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
  const sorted = sortData(filteredResults);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const pageData = sorted.slice(start, start + pageSize);

  const table = document.querySelector('table');
  const tbody = document.getElementById('directoryBody');
  const cardContainer = document.getElementById('cardContainer');
  const entryCount = document.getElementById('entryCount');

  // Show total filtered entries
  entryCount.textContent = `${filteredResults.length} residence${filteredResults.length !== 1 ? 's' : ''} matching your filters.`;

  if (viewMode === 'card') {
    table.style.display = 'none';
    cardContainer.style.display = 'block';
    cardContainer.innerHTML = '';

    if (pageData.length === 0) {
      cardContainer.innerHTML = `<p>No residences match your filters.</p>`;
      document.getElementById('pageInfo').textContent = '';
      return;
    }

    pageData.forEach(r => {
      const card = document.createElement('div');
      card.className = 'residence-card';
      card.innerHTML = `
        <h3>${r.name}</h3>
        <p><strong>Address:</strong> ${r.address}</p>
        <p><strong>Phone:</strong> ${r.phone}</p>
        <p><strong>Email:</strong> <a href="mailto:${r.email}">${r.email}</a></p>
        <p><strong>Website:</strong> <a href="${r.website}" target="_blank" rel="noopener noreferrer">link</a></p>
        <p><a href="${r.map}" target="_blank" rel="noopener noreferrer">View Map</a></p>
      `;
      card.addEventListener('click', () => showPopup(r));
      cardContainer.appendChild(card);
    });
  } else {
    table.style.display = 'table';
    cardContainer.style.display = 'none';
    tbody.innerHTML = '';

    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No residences match your filters.</td></tr>`;
      document.getElementById('pageInfo').textContent = '';
      return;
    }

    // <td>${r.amenities}</td>
    // <td>${r.desc}</td>
    pageData.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.name}</td>
        <td>${r.address}</td>
        <td>${r.phone}</td>
        <td><a href="mailto:${r.email}">${r.email}</a></td>
        <td><a href="${r.website}" target="_blank" rel="noopener noreferrer">link</a></td>
        <td><a href="${r.map}" target="_blank" rel="noopener noreferrer">View Map</a></td>
      `;
      row.addEventListener('click', () => showPopup(r));
      tbody.appendChild(row);
    });

    // Update sort arrows //??
    document.querySelectorAll('th[data-key]').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.getAttribute('data-key') === sortConfig.key) {
        th.classList.add(sortConfig.direction === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
}

function exportToExcel() {
  const sheet = XLSX.utils.json_to_sheet(sortData(filteredResults));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Directory");
  XLSX.writeFile(wb, "filtered_directory.xlsx");
}

function printView() {
  const container = document.createElement('div');
  container.style.padding = '20px';
  const data = sortData(filteredResults);
  data.forEach(r => {
    const card = document.createElement('div');
    card.className = 'residence-card';
    card.innerHTML = `
      <h3>${r.name}</h3>
      <p><strong>Address:</strong> ${r.address}</p>
      <p><strong>Phone:</strong> ${r.phone}</p>
      <p><strong>Email:</strong> ${r.email}</p>
      <p><strong>Website:</strong> ${r.website}</p>
      <p><strong>Amenities:</strong> ${r.amenities}</p>
      <hr />
    `;
    container.appendChild(card);
  });
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write('<html><head><title>Print Directory</title></head><body>');
  printWindow.document.write(container.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function exportToPDF() {
  const container = document.createElement('div');
  container.style.padding = '20px';
  const data = sortData(filteredResults);

  if (viewMode === 'card') {
    data.forEach(r => {
      const card = document.createElement('div');
      card.className = 'residence-card';
      card.innerHTML = `
        <h3>${r.name}</h3>
        <p><strong>Address:</strong> ${r.address}</p>
        <p><strong>Phone:</strong> ${r.phone}</p>
        <p><strong>Email:</strong> ${r.email}</p>
        <p><strong>Website:</strong> ${r.website}</p>
        <p><strong>Amenities:</strong> ${r.amenities}</p>
        <p>${r.map}</p>
        <hr />
      `;
      container.appendChild(card);
    });
  } else {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.border = '1';
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Residence Name</th><th>Address</th><th>Phone</th><th>Email</th><th>Website</th><th>Amenities</th><th>Description</th><th>Map</th>
      </tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    data.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.name}</td>
        <td>${r.address}</td>
        <td>${r.phone}</td>
        <td>${r.email}</td>
        <td>${r.website}</td>
        <td>${r.amenities}</td>
        <td>${r.map}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  html2pdf().set({
    margin: 10,
    filename: 'filtered_directory.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(container).save();
}

function showPopup(r) {
  const popup = document.getElementById('popupOverlay');
  const content = document.getElementById('popupContent');
  content.innerHTML = `
    <h2>${r.name}</h2>
    <p><strong>Address:</strong> ${r.address}</p>
    <p><strong>Phone:</strong> ${r.phone}</p>
    <p><strong>Email:</strong> <a href="mailto:${r.email}">${r.email}</a></p>
    <p><strong>Website:</strong> <a href="${r.website}" target="_blank" rel="noopener noreferrer">link</a></p>
    <p><strong>Amenities:</strong> ${r.amenities}</p>
    <p><a href="${r.map}" target="_blank" rel="noopener noreferrer">View Map</a></p>
  `;
  popup.style.display = 'flex';
}