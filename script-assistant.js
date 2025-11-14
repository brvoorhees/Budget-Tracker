let budgetData = JSON.parse(localStorage.getItem('budgetData')) || {};

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = now.getFullYear();

  populateMonthDropdown();
  document.getElementById('month').value = currentMonth;
  document.getElementById('year').value = currentYear;

  document.getElementById('categoryLimit').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addCategory();
    }
  });
    
  renderCategoryEditor();
  renderDisplay();
});


function populateMonthDropdown() {
  const select = document.getElementById('month');
  select.innerHTML = '';
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' })
  );
  months.forEach((name, i) => {
    const value = (i + 1).toString().padStart(2, '0');
    const option = document.createElement('option');
    option.value = value;
    option.textContent = name;
    select.appendChild(option);
  });
  select.value = (new Date().getMonth() + 1).toString().padStart(2, '0');
}

function getKey() {
  const month = document.getElementById('month').value;
  const year = document.getElementById('year').value;
  return `${year}-${month}`;
}

function saveBudget() {
  const key = getKey();
  const total = parseInt(document.getElementById('budgetTotal').value);
  if (!total || total <= 0) return alert('Budget must be greater than 0.');

  if (!budgetData[key]) budgetData[key] = { total: 0, categories: {} };
  budgetData[key].total = total;
  localStorage.setItem('budgetData', JSON.stringify(budgetData));
  renderDisplay();
}

function addCategory() {
  const key = getKey();
  const nameInput = document.getElementById('categoryName');
  const limitInput = document.getElementById('categoryLimit');

  const name = nameInput.value.trim();
  const limit = parseFloat(limitInput.value).toFixed(2);
  if (!name || isNaN(limit) || limit <= 0) return alert('Enter valid name and limit.');


  if (!name || !limit || limit <= 0) return alert('Enter valid name and limit.');

  if (!budgetData[key]) budgetData[key] = { total: 0, categories: {} };
  const total = budgetData[key].total;
  const categories = budgetData[key].categories;

  const currentSum = Object.values(categories).reduce((a, b) => a + b, 0);
  if (currentSum + limit > total) return alert('Category limits exceed budget.');

  categories[name] = limit;
  localStorage.setItem('budgetData', JSON.stringify(budgetData));

  // ✅ Clear inputs and refocus
  nameInput.value = '';
  limitInput.value = '';
  nameInput.focus(); // 👈 puts cursor back in category name

  renderCategoryEditor();
  renderDisplay();
}

function navigateTo(page) {
  window.location.href = page;
}


function renderCategoryEditor() {
  const key = getKey();
  const container = document.getElementById('categoryEditor');
  container.innerHTML = '';

  const categories = budgetData[key]?.categories || {};
  Object.entries(categories).forEach(([name, value]) => {
    const row = document.createElement('div');
    row.className = 'category-row';
    row.innerHTML = `
      <input type="text" value="${name}" data-original="${name}" />
      <input type="number" value="${value}" />
      <button onclick="updateCategory(this)">Update</button>
      <button onclick="deleteCategory('${name}')">Delete</button>
    `;
    container.appendChild(row);
  });
}

function updateCategory(btn) {
  const row = btn.parentElement;
  const nameInput = row.querySelector('input[type="text"]');
  const valueInput = row.querySelector('input[type="number"]');
  const original = nameInput.dataset.original;
  const newName = nameInput.value.trim();
  const newValue = parseFloat(valueInput.value);

  const key = getKey();
  const categories = budgetData[key]?.categories || {};
  const total = budgetData[key]?.total || 0;

  const otherSum = Object.entries(categories)
    .filter(([n]) => n !== original)
    .reduce((sum, [, val]) => sum + val, 0);

  if (!newName) return alert('Enter a valid name.');
  if (isNaN(newValue) || newValue <= 0) return alert('Enter a valid number.');
  if (otherSum + newValue > total) return alert('Total limits exceed budget.');

  delete categories[original];
  categories[newName] = newValue;
  localStorage.setItem('budgetData', JSON.stringify(budgetData));
  renderCategoryEditor();
  renderDisplay();
}

function toggleCategoryEditor() {
  const editor = document.getElementById('categoryEditor');
  editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
}

function deleteCategory(name) {
  const key = getKey();
  delete budgetData[key]?.categories[name];
  localStorage.setItem('budgetData', JSON.stringify(budgetData));
  renderCategoryEditor();
  renderDisplay();
}

function renderDisplay() {
  const key = getKey();
  const entry = budgetData[key];
  const display = document.getElementById('display');

  let output = `📅 ${key}\n`;

  if (!entry || !entry.total) {
    output += '⚠️ No budget set for this month.\n';
  } else {
    const total = entry.total;
    const categories = entry.categories || {};
    const allocated = Object.values(categories).reduce((sum, val) => {
      const num = parseFloat(val);
      return isNaN(num) ? sum : sum + num;
    }, 0);
    
    const remaining = total - allocated;

    output += `💰 Budget: $${total.toFixed(2)}\n`;
    output += `💡 Remaining: $${remaining.toFixed(2)}\n`;

  }

  const categories = entry?.categories || {};
  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (sorted.length > 0) {
    Object.entries(categories).forEach(([name, val]) => {
      const num = parseFloat(val);
      output += `- ${name}: $${isNaN(num) ? 'Invalid' : num.toFixed(2)}\n`;
    });
    
  } else {
    output += `\n🗂️ No categories added yet.`;
  }

  display.textContent = output.trim();
}

document.getElementById('month').addEventListener('change', () => {
  renderDisplay();
  renderCategoryEditor();
});

document.getElementById('year').addEventListener('change', () => {
  renderDisplay();
  renderCategoryEditor();
});


function confirmDelete() {
  document.getElementById('deletePopup').style.display = 'block';
}

function deleteData() {
  const key = getKey();
  const deleteAll = document.getElementById('deleteAll').checked;

  if (deleteAll) {
    if (confirm('Delete ALL data?')) {
      localStorage.removeItem('budgetData');
      budgetData = {};
    }
  } else {
    delete budgetData[key];
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
  }

  document.getElementById('deletePopup').style.display = 'none';
  renderCategoryEditor();
  renderDisplay();
}