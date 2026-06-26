/**
 * FASE 3 - main.js UPDATES
 * Copiar/colar essas funções no main.js existente
 * Substituir: openAddHouseholdModal, handleAddHousehold, etc
 */

// ========== ADD HOUSEHOLD MODAL ==========

function openAddHouseholdModal() {
  // Limpar formulário
  document.getElementById('hhName').value = '';
  document.getElementById('hhDesc').value = '';
  document.getElementById('descCount').textContent = '0';
  document.getElementById('addHhErr').style.display = 'none';
  
  // Abrir modal
  openModal('addHouseholdModal');
}

async function handleAddHousehold(e) {
  e.preventDefault();
  
  const nome = document.getElementById('hhName').value.trim();
  const descricao = document.getElementById('hhDesc').value.trim();
  const errDiv = document.getElementById('addHhErr');
  
  // Validar
  const validation = Validators.validateHouseholdForm(nome, descricao);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    errDiv.textContent = firstError;
    errDiv.style.display = 'block';
    return;
  }
  
  toast('Criando loja...', 'loading');
  errDiv.style.display = 'none';
  
  // Chamar API
  const result = await dataService.addHousehold(nome, descricao);
  
  if (result.success) {
    toast('Loja criada com sucesso!', 'success');
    closeModal('addHouseholdModal');
    
    // Recarregar lista
    setTimeout(() => {
      loadHouseholds();
    }, 1000);
  } else {
    errDiv.textContent = result.message;
    errDiv.style.display = 'block';
    toast(result.message, 'danger');
  }
}

// ========== EDIT HOUSEHOLD ==========

function editHousehold(hhId) {
  // TODO: Fase 4 - Modal editar loja
  toast('Editar loja (Fase 4)', 'info');
}

// ========== DELETE HOUSEHOLD ==========

async function deleteHousehold(hhId) {
  if (!confirm('Tem certeza que quer deletar essa loja?')) {
    return;
  }
  
  toast('Deletando...', 'loading');
  
  const result = await dataService.deleteHousehold(hhId);
  
  if (result.success) {
    toast('Loja deletada', 'success');
    await loadHouseholds();
  } else {
    toast(result.message, 'danger');
  }
}

// ========== ADD ITEM ==========

async function addItem() {
  const hhId = localStorage.getItem('hhId');
  if (!hhId) {
    toast('Nenhuma loja selecionada', 'danger');
    return;
  }

  const input = document.getElementById('itemName');
  const nome = input?.value.trim() || '';
  
  if (!nome) {
    toast('Digite o nome do item', 'danger');
    return;
  }

  // Validar
  const validation = Validators.validateItemForm(nome, 1, 'Geral');
  if (!validation.valid) {
    toast(Object.values(validation.errors)[0], 'danger');
    input.value = '';
    return;
  }
  
  toast('Adicionando item...', 'loading');
  
  // Chamar API
  const result = await dataService.addItem(hhId, nome, 1, 'un', 'Geral');
  
  if (result.success) {
    toast('Item adicionado!', 'success');
    input.value = '';
    await loadItems();
  } else {
    toast(result.message, 'danger');
  }
}

// ========== TOGGLE ITEM CHECK ==========

async function toggleItemCheck(itemId, event) {
  event.stopPropagation();
  
  const item = document.querySelector(`[data-item-id="${itemId}"]`);
  const isChecked = !item.classList.contains('checked');
  
  const result = await dataService.toggleItem(itemId, isChecked);
  
  if (result.success) {
    item.classList.toggle('checked');
  } else {
    toast(result.message, 'danger');
  }
}

// ========== EDIT ITEM ==========

function editItem(itemId) {
  // TODO: Fase 4 - Modal editar item
  toast('Editar item (Fase 4)', 'info');
}

// ========== DELETE ITEM ==========

async function deleteItem(itemId) {
  if (!confirm('Deletar item?')) {
    return;
  }
  
  toast('Deletando...', 'loading');
  
  const result = await dataService.deleteItem(itemId);
  
  if (result.success) {
    toast('Item deletado', 'success');
    await loadItems();
  } else {
    toast(result.message, 'danger');
  }
}

// ========== SEARCH ITEMS ==========

async function searchItems() {
  const hhId = localStorage.getItem('hhId');
  const term = document.getElementById('searchInput')?.value.trim() || '';
  
  if (!term) {
    await loadItems();
    return;
  }
  
  toast('Buscando...', 'loading');
  
  const result = await dataService.searchItems(hhId, term);
  
  if (result.success) {
    const items = result.data || [];
    const container = document.getElementById('itemsContainer');
    
    container.innerHTML = `
      <div class="sec-label">Resultados da busca (${items.length})</div>
      <ul class="items">
        ${items.map(item => `
          <li class="item" data-item-id="${item.id}">
            <div class="item-check" onclick="toggleItemCheck('${item.id}', event)">✓</div>
            <div class="item-info">
              <p class="item-name">${item.nome}</p>
              <div class="item-meta">
                <span class="item-cat">${item.category}</span>
                ${item.qty}${item.unit}
              </div>
            </div>
            <div class="item-actions">
              <button class="item-action" onclick="editItem('${item.id}')">✏️</button>
              <button class="item-action del" onclick="deleteItem('${item.id}')">🗑️</button>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
    
    toast('Busca concluída', 'success');
  } else {
    toast(result.message, 'danger');
  }
}

// ========== CLEAR SEARCH ==========

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    input.value = '';
    document.getElementById('searchClear').style.display = 'none';
  }
  loadItems();
}

// ========== LOGOUT ==========

function logout() {
  authService.logout();
  toast('Logout realizado', 'success');
  setTimeout(() => showScreen('auth'), 500);
}

// ========== SETTINGS TABS ==========

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  document.querySelectorAll('.settings-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const tab = document.getElementById(`${tabName}Tab`);
  if (tab) tab.classList.remove('hidden');
  
  if (event?.target) event.target.classList.add('active');
}

// ========== SETTINGS: PROFILE UPDATE ==========

function handleProfileUpdate(e) {
  e.preventDefault();
  // TODO: Implementar em Fase 4
  toast('Perfil atualizado (Fase 4)', 'success');
  closeModal('settingsModal');
}

// ========== SETTINGS: ORG UPDATE ==========

function handleOrgUpdate(e) {
  e.preventDefault();
  // TODO: Implementar em Fase 4
  toast('Organização atualizada (Fase 4)', 'success');
}

// ========== AUTH MODE SWITCH ==========

function switchAuthMode(modeName) {
  document.querySelectorAll('.auth-mode-screen').forEach(screen => {
    screen.style.display = 'none';
  });
  
  const screen = document.getElementById(`${modeName}Screen`);
  if (screen) screen.style.display = 'block';
}
