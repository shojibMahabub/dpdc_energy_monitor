const BIN_ID = '685a43638a456b7966b47dc4';
const API_KEY = '$2a$10$9nbOuEttaAgzRjrUw6gfSeh4v27NDCuC13QK/Oy7ZqfoP6T0jeYQ6';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

let data = [];

// Pagination variables
let currentPage = 1;
const pageSize = 5;

// Sorting variables
let sortColumn = 'id';
let sortDirection = 'desc'; // 'asc' or 'desc'

let rechargeLineChart = null;
let rechargeBarChart = null;

function getPageCount() {
  return Math.ceil(data.length / pageSize);
}

function renderPagination() {
  const pageCount = getPageCount();
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  if (pageCount <= 1) return;

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
  prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
  prevLi.onclick = function(e) { e.preventDefault(); if (currentPage > 1) { currentPage--; refreshTable(); } };
  pagination.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= pageCount; i++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (i === currentPage ? ' active' : '');
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.onclick = function(e) { e.preventDefault(); currentPage = i; refreshTable(); };
    pagination.appendChild(li);
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = 'page-item' + (currentPage === pageCount ? ' disabled' : '');
  nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
  nextLi.onclick = function(e) { e.preventDefault(); if (currentPage < pageCount) { currentPage++; refreshTable(); } };
  pagination.appendChild(nextLi);
}

async function loadData() {
  try {
    const res = await fetch(API_URL, {
      headers: { 'X-Master-Key': API_KEY }
    });
    const json = await res.json();
    data = json.record || [];
    refreshTable();
  } catch (e) {
    console.error("Error loading data", e);
  }
}

function generateId() {
  if (!data.length) return 1;
  // Find the max numeric id in data (handle both string and number ids)
  const maxId = data.reduce((max, row) => {
    const idNum = parseInt(row.id, 10);
    return (!isNaN(idNum) && idNum > max) ? idNum : max;
  }, 0);
  return maxId + 1;
}

function openRechargeModal() {
  // Set date input to today
  const dateInput = document.getElementById('date');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;
  var modal = new bootstrap.Modal(document.getElementById('rechargeModal'));
  modal.show();
}

// Helper to format date as '01 Jan 2025'
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr; // fallback for already formatted
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function addRowToTable(row) {
  const table = document.getElementById("rechargeTable").getElementsByTagName("tbody")[0];
  const newRow = table.insertRow();
  newRow.setAttribute("data-id", row.id);

  let actionButtons = '';
  if (row.approved === 1) {
    actionButtons = `
      <button class="btn btn-link p-0 me-2" title="Edit" onclick="editRow('${row.id}')"><i class="bi bi-pencil-square text-warning"></i></button>
      <button class="btn btn-link p-0" title="Delete" onclick="deleteRow('${row.id}')"><i class="bi bi-trash text-danger"></i></button>
    `;
  } else if (row.approved === -1) {
    actionButtons = `<i class='bi bi-x-circle text-danger' title='Rejected'></i>`;
  } else {
    actionButtons = `
      <button class="btn btn-link p-0 me-2" title="Approve" onclick="approveRow('${row.id}')"><i class="bi bi-check-circle text-success"></i></button>
      <button class="btn btn-link p-0" title="Reject" onclick="rejectRow('${row.id}')"><i class="bi bi-x-circle text-secondary"></i></button>
    `;
  }

  newRow.innerHTML = `
    <td>${row.id}</td>
    <td>${formatDisplayDate(row.date)}</td>
    <td>${row.balance}</td>
    <td>${row.recharged}</td>
    <td>${row.newBalance}</td>
    <td>${row.energy_cost ?? ''}</td>
    <td>${row.vat ?? ''}</td>
    <td>${row.rebate ?? ''}</td>
    <td>${row.debt ?? ''}</td>
    <td>${row.fee}</td>
    <td>${row.dpdc_token ?? ''}</td>
    <td>${actionButtons}</td>
  `;
}

async function addRow() {
  const dateRaw = document.getElementById("date").value;
  const date = formatDisplayDate(dateRaw);
  const balance = parseFloat(document.getElementById("balance").value);
  const recharged = parseFloat(document.getElementById("recharged").value);
  const newBalance = parseFloat(document.getElementById("newBalance").value);

  if (!date || isNaN(balance) || isNaN(recharged) || isNaN(newBalance)) {
    alert("Please fill in all required fields: date, balance, recharged, and new balance");
    return;
  }

  const fee = (balance + recharged - newBalance).toFixed(2);
  const id = generateId();

  const row = {
    id, date, balance, recharged, newBalance, fee,
    energy_cost: null, vat: null, rebate: null, debt: null,
    dpdc_token: null,
    approved: 0 // 0 = pending, 1 = approved, -1 = rejected
  };

  data.push(row);
  currentPage = getPageCount(); // go to last page
  await updateBin();
  refreshTable();

  // Reset fields
  ['date', 'balance', 'recharged', 'newBalance'].forEach(id => document.getElementById(id).value = "");
}

function openTokenModal() {
  document.getElementById('modalId').value = '';
  document.getElementById('modalToken').value = '';
  var modal = new bootstrap.Modal(document.getElementById('tokenModal'));
  modal.show();
}

function closeTokenModal() {
  var modalEl = document.getElementById('tokenModal');
  var modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

async function submitTokenModal() {
  const id = document.getElementById('modalId').value.trim();
  const token = document.getElementById('modalToken').value.trim();
  if (!id || !token) {
    alert('Please enter both ID and DPDC token.');
    return;
  }
  const rowIndex = data.findIndex(r => r.id == id);
  if (rowIndex === -1) {
    alert('ID not found.');
    return;
  }
  data[rowIndex].dpdc_token = token;

  // Parse values from token
  const energyCostMatch = token.match(/Energy Cost:([\d.\-]+)/);
  const vatMatch = token.match(/VAT:([\d.\-]+)/);
  const rebateMatch = token.match(/Rebate:([\d.\-]+)/);
  const debtMatch = token.match(/Debt:([\d.\-]+)/);
  if (energyCostMatch) data[rowIndex].energy_cost = parseFloat(energyCostMatch[1]);
  if (vatMatch) data[rowIndex].vat = parseFloat(vatMatch[1]);
  if (rebateMatch) data[rowIndex].rebate = parseFloat(rebateMatch[1]);
  if (debtMatch) data[rowIndex].debt = parseFloat(debtMatch[1]);

  await updateBin();
  closeTokenModal();
  refreshTable();
}

async function updateBin() {
  console.log("updateBin called", data);
  await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY
    },
    body: JSON.stringify(data)
  });
}

// Approve row
async function approveRow(id) {
  console.log(data )
  const idx = data.findIndex(r => r.id == id);
  if (idx !== -1) {
    data[idx].approved = 1;
    await updateBin();
    refreshTable();
  }
}
// Reject row
async function rejectRow(id) {
  console.log("rejectRow called", id);
  const idx = data.findIndex(r => r.id == id);
  if (idx !== -1) {
    data[idx].approved = -1;
    await updateBin();
    refreshTable();
  }
}
// Delete row
async function deleteRow(id) {
  console.log("deleteRow called", id);
  const idx = data.findIndex(r => r.id == id);
  if (idx !== -1) {
    if (confirm('Are you sure you want to delete this row?')) {
      data.splice(idx, 1);
      await updateBin();
      if ((currentPage - 1) * pageSize >= data.length - 1) {
        currentPage = Math.max(1, currentPage - 1);
      }
      refreshTable();
    }
  }
}
// Edit row (simple prompt-based for now)
async function editRow(id) {
  console.log("editRow called", id);
  const idx = data.findIndex(r => r.id == id);
  if (idx !== -1) {
    const row = data[idx];
    const date = prompt('Edit Date:', row.date);
    const balance = prompt('Edit Balance:', row.balance);
    const recharged = prompt('Edit Recharged:', row.recharged);
    const newBalance = prompt('Edit New Balance:', row.newBalance);
    if (date && balance && recharged && newBalance) {
      row.date = formatDisplayDate(date);
      row.balance = parseFloat(balance);
      row.recharged = parseFloat(recharged);
      row.newBalance = parseFloat(newBalance);
      row.fee = (row.balance + row.recharged - row.newBalance).toFixed(2);
      await updateBin();
      refreshTable();
    }
  }
}
// Helper to refresh table
function refreshTable() {
  const tbody = document.getElementById("rechargeTable").getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  // Sorting and pagination logic
  const sorted = getSortedData();
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  sorted.slice(start, end).forEach(addRowToTable);
  renderPagination();
  updateSortIcons();
  renderCharts();
}

function closeRechargeModal() {
  var modalEl = document.getElementById('rechargeModal');
  var modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

function sortTable(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  currentPage = 1;
  refreshTable();
}

function getSortedData() {
  const sorted = [...data];
  sorted.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    // For date, parse as date
    if (sortColumn === 'date') {
      aVal = Date.parse(aVal);
      bVal = Date.parse(bVal);
    }
    // For numbers, parse as float
    if ([
      'id','balance','recharged','newBalance','energy_cost','vat','rebate','debt','fee'
    ].includes(sortColumn)) {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

function updateSortIcons() {
  const columns = ['id','date','balance','recharged','newBalance','energy_cost','vat','rebate','debt','fee'];
  columns.forEach(col => {
    const el = document.getElementById('sort-' + col);
    if (el) {
      if (col === sortColumn) {
        el.innerHTML = sortDirection === 'asc' ? '▲' : '▼';
      } else {
        el.innerHTML = '';
      }
    }
  });
}

function renderCharts() {
  const ctxLine = document.getElementById('rechargeLineChart').getContext('2d');
  const ctxBar = document.getElementById('rechargeBarChart').getContext('2d');
  // Prepare data (sorted by date ascending for line chart)
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sortedData.map(row => row.date);
  const recharged = sortedData.map(row => row.recharged);
  const energyCost = sortedData.map(row => row.energy_cost ?? 0);
  const vat = sortedData.map(row => row.vat ?? 0);
  const rebate = sortedData.map(row => row.rebate ?? 0);
  const debt = sortedData.map(row => row.debt ?? 0);

  // Destroy previous charts if they exist
  if (rechargeLineChart) rechargeLineChart.destroy();
  if (rechargeBarChart) rechargeBarChart.destroy();

  rechargeLineChart = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Recharged',
        data: recharged,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Recharged' } } }
    }
  });

  rechargeBarChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Energy Cost', data: energyCost, backgroundColor: 'rgba(75, 192, 192, 0.7)' },
        { label: 'VAT', data: vat, backgroundColor: 'rgba(255, 205, 86, 0.7)' },
        { label: 'Rebate', data: rebate, backgroundColor: 'rgba(255, 99, 132, 0.7)' },
        { label: 'Debt', data: debt, backgroundColor: 'rgba(153, 102, 255, 0.7)' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Amount' } } }
    }
  });
}

window.onload = function() { loadData(); };
window.approveRow = approveRow;
window.rejectRow = rejectRow;
window.editRow = editRow;
window.deleteRow = deleteRow;
window.addRow = addRow;
window.openTokenModal = openTokenModal;
window.submitTokenModal = submitTokenModal;
window.openRechargeModal = openRechargeModal;
window.closeRechargeModal = closeRechargeModal;
window.sortTable = sortTable; 