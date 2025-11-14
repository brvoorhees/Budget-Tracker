let isEditingExpenses = false;
let budgetData = JSON.parse(localStorage.getItem('budgetData')) || {};

window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = now.getFullYear();

  populateMonthDropdown();
  document.getElementById('month').value = currentMonth;
  document.getElementById('year').value = currentYear;

  renderCategoryDropdown();
  renderOverview();

  document.getElementById('month').addEventListener('change', () => {
    renderCategoryDropdown();
    renderOverview();
  });

  document.getElementById('year').addEventListener('change', () => {
    renderCategoryDropdown();
    renderOverview();
  });

  document.getElementById('expenseAmount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addExpense();
    }
  });
  
  

  document.getElementById('categorySelect').addEventListener('change', renderCategoryInfo);
});

function navigateTo(page) {
  window.location.href = page;
}

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
}

function getKey() {
  const month = document.getElementById('month').value;
  const year = document.getElementById('year').value;
  return `${year}-${month}`;
}

function renderCategoryDropdown() {
  const key = getKey();
  const select = document.getElementById('categorySelect');
  select.innerHTML = '';

  const categories = budgetData[key]?.categories || {};
  Object.keys(categories).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  renderCategoryInfo();
}

function renderCategoryInfo() {
    const key = getKey();
    const category = document.getElementById('categorySelect').value;
    const info = document.getElementById('categoryInfo');
  
    const limit = budgetData[key]?.categories?.[category] || 0;
    const entries = budgetData[key]?.expenses?.[category] || [];
    const spent = entries.reduce((sum, entry) => sum + entry.amount, 0);
  
    const spentText = spent > limit
      ? `<span class="highlight">$${spent.toFixed(2)}</span>`
      : `$${spent.toFixed(2)}`;
  
      info.innerHTML = `
      Allotted: $${limit.toFixed(2)} | Spent: ${spentText}<br><br>
      <strong>Entries:</strong><br>
    `;
    
    entries.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'expense-row';
    
      if (isEditingExpenses) {
        div.innerHTML = `
  <div style="display: flex; gap: 5px; flex-wrap: wrap;">
    <input type="number" value="${entry.amount}" step="0.01" style="flex: 1 1 30%;" />
    <input type="text" value="${entry.name || ''}" style="flex: 1 1 50%;" />
    <div style="flex: 1 1 100%; display: flex; justify-content: flex-end; gap: 5px; margin-top: 5px;">
      <button onclick="saveExpense('${category}', ${i}, this)">Update</button>
      <button onclick="deleteExpense('${category}', ${i})">Delete</button>
    </div>
  </div>
`;

      } else {
        div.innerHTML = `
          $${entry.amount.toFixed(2)} — ${entry.name || 'Unnamed'}
         
        `;
      }
    
      info.appendChild(div);
    });
    
  }
  
  function addExpense() {
    const key = getKey();
    const category = document.getElementById('categorySelect').value;
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (!category || isNaN(amount) || amount <= 0) return alert('Enter a valid expense amount.');
  
    if (!budgetData[key]) budgetData[key] = { total: 0, categories: {}, expenses: {} };
    if (!budgetData[key].expenses) budgetData[key].expenses = {};
    if (!budgetData[key].expenses[category]) budgetData[key].expenses[category] = [];
  
    budgetData[key].expenses[category].push({ amount, name });
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
  
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseName').value = '';
    renderCategoryInfo();
    renderOverview();

    // ✅ Refocus on name field for next entry
    document.getElementById('expenseName').focus();

  }  
  
  function editExpense(category, index, btn) {
  const key = getKey();
  const row = btn.parentElement;
  const amountInput = row.querySelector('input[type="number"]');
  const nameInput = row.querySelector('input[type="text"]');

  const newAmount = parseFloat(amountInput.value);
  const newName = nameInput.value.trim();

  if (isNaN(newAmount) || newAmount <= 0) return alert('Enter a valid amount.');

  budgetData[key].expenses[category][index] = {
    amount: newAmount,
    name: newName
  };

  localStorage.setItem('budgetData', JSON.stringify(budgetData));
  renderCategoryInfo();
  renderOverview();
}

function toggleExpenseEdit() {
    isEditingExpenses = !isEditingExpenses;
    renderCategoryInfo();
  }  

function startEdit(category, index) {
    const key = getKey();
    budgetData[key].expenses[category][index]._editing = true;
    renderCategoryInfo();
  }
  
  function cancelEdit(category, index) {
    const key = getKey();
    delete budgetData[key].expenses[category][index]._editing;
    renderCategoryInfo();
  }
  
  function saveExpense(category, index, btn) {
    const key = getKey();
    const row = btn.parentElement;
    const amountInput = row.querySelector('input[type="number"]');
    const nameInput = row.querySelector('input[type="text"]');
  
    const newAmount = parseFloat(amountInput.value);
    const newName = nameInput.value.trim();
  
    if (isNaN(newAmount) || newAmount <= 0) return alert('Enter a valid amount.');
  
    budgetData[key].expenses[category][index] = {
      amount: newAmount,
      name: newName
    };
  
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    renderCategoryInfo();
    renderOverview();
  }
  
  function deleteExpense(category, index) {
    const key = getKey();
    budgetData[key].expenses[category].splice(index, 1);
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    renderCategoryInfo();
    renderOverview();
  }  

  function renderOverview() {
    const key = getKey();
    const entry = budgetData[key];
    const overview = document.getElementById('overview');
  
    if (!entry || !entry.categories) {
      overview.textContent = 'No categories for this month.';
      return;
    }
  
    const sorted = Object.entries(entry.categories)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  
    const total = entry.total || 0;
    const allocated = Object.values(entry.categories).reduce((sum, val) => {
        const num = parseFloat(val);
        return isNaN(num) ? sum : sum + num;
      }, 0);
      
    const leftover = total - allocated;
  
    let output = `📅 ${key}\n💰 Budget: $${total.toFixed(2)}\n`;
    output += `🗂️ Allocated: $${allocated.toFixed(2)}\n`;
    output += `🟢 Left Over: $${leftover.toFixed(2)}\n\n🗂️ Categories:\n`;
  
    sorted.forEach(([name, limit]) => {
      const entries = entry.expenses?.[name] || [];
      const spent = entries.reduce((sum, entry) => {
        if (typeof entry === 'number') return sum + entry;
        if (typeof entry === 'object' && typeof entry.amount === 'number') return sum + entry.amount;
        return sum;
      }, 0);
  
      const parsedLimit = parseFloat(limit);
const spentText = spent > parsedLimit
  ? `Spent: $${spent.toFixed(2)} 🔴`
  : `Spent: $${spent.toFixed(2)}`;

output += `- ${name}: Limit $${isNaN(parsedLimit) ? 'Invalid' : parsedLimit.toFixed(2)} | ${spentText}\n`;

    });
  
    overview.textContent = output.trim();
  }
  

  function clearMonthExpensesOnly() {
    const key = getKey();
    if (!budgetData[key] || !budgetData[key].expenses) {
      return alert('No expenses found for this month.');
    }
  
    const confirmDelete = confirm(`Are you sure you want to delete all expense entries for ${key}?`);
    if (!confirmDelete) return;
  
    budgetData[key].expenses = {}; // ✅ Clears only expenses
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
  
    renderCategoryInfo();
    renderOverview();
    alert(`All expense entries for ${key} have been deleted.`);
  }
  
  
