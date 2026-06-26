/**
 * main.js - FASE 3 COMPLETO
 * Sistema Multiempresas - App Principal
 * Integrado com authService + dataService + validators
 */

// ========== INIT ==========
let appSecurity = null;
let authMiddleware = null;
let permissionMiddleware = null;
let rateLimiter = null;

async function initApp() {
  console.log('App inicializando...');
  
  // Inicializar rate limiter
  rateLimiter = new RateLimiter({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    lockoutDurationMs: 30 * 60 * 1000
  });

  // Inicializar session manager
  const sessionManager = new SessionManager({
    sessionTimeout: 15 * 60 * 1000,
    onSessionExpire: () => {
      toast('Sessão expirada. Faça login novamente.', 'danger');
      setTimeout(() => {
        sessionManager.logout();
        showScreen('auth');
      }, 2000);
    },
    onSessionWarning: (info) => {
      toast(info.message, 'warning');
    }
  });

  // Inicializar permission manager
  const permissionManager = new PermissionManager(null);
  
  // Inicializar middleware
  authMiddleware = new AuthMiddleware(sessionManager);
  permissionMiddleware = new PermissionMiddleware(permissionManager);

  // Salvar na window
  window.sessionManager = sessionManager;
  window.permissionManager = permissionManager;

  // ✅ Injetar sessionManager em authService
  authService.setSessionManager(sessionManager);

  // ✅ CARREGAR TEMPLATES PRIMEIRO
  try {
    console.log('Carregando templates...');
    await loadAppTemplates();
    console.log('Templates carregados!');
  } catch (error) {
    console.error('Erro ao carregar templates:', error);
    toast('Erro ao carregar templates', 'danger');
    return;
  }

  // Restaurar sessão se existir
  const session = sessionManager.getSession();
  if (session && session.user) {
    console.log('Sessão restaurada:', session.user.nome);
    setTimeout(() => showScreen('households'), 500);
  } else {
    showScreen('auth');
  }

  // Restaurar tema
  initTheme();
}

// ========== THEME ==========
function initTheme() {
  const savedTheme = localStorage.getItem('app-theme') || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('app-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('app-theme', 'light');
  }
  updateThemeBtn();
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setTheme(isDark ? 'light' : 'dark');
}

function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = isDark ? '☀️' : '🌙';
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = icon;
  const authBtn = document.getElementById('themeToggleAuth');
  if (authBtn) authBtn.innerHTML = icon;
}

// ========== AUTH ==========

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errDiv = document.getElementById('loginErr');

  // Validar client-side
  const validation = Validators.validateLoginForm(email, password);
  if (!validation.valid) {
    errDiv.textContent = Object.values(validation.errors)[0];
    errDiv.style.display = 'block';
    return;
  }

  // Rate limit check
  const rateLimitCheck = rateLimiter.check(email, 'login');
  if (!rateLimitCheck.allowed) {
    errDiv.textContent = rateLimitCheck.reason;
    errDiv.style.display = 'block';
    return;
  }

  toast('Entrando...', 'loading');
  errDiv.style.display = 'none';

  // Login real via authService
  const result = await authService.login(email, password);

  if (result.success) {
    toast('Login bem-sucedido!', 'success');
    rateLimiter.reset(email, 'login');
    setTimeout(() => showScreen('households'), 1000);
  } else {
    errDiv.textContent = result.message;
    errDiv.style.display = 'block';
    toast(result.message, 'danger');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirm').value;
  const errDiv = document.getElementById('registerErr');

  // Validar
  const validation = Validators.validateRegisterForm(name, email, password, confirmPassword);
  if (!validation.valid) {
    errDiv.textContent = Object.values(validation.errors)[0];
    errDiv.style.display = 'block';
    return;
  }

  toast('Criando conta...', 'loading');
  errDiv.style.display = 'none';

  // Register real via authService
  const result = await authService.register(name, email, password);

  if (result.success) {
    toast('Conta criada! Faça login para continuar.', 'success');
    setTimeout(() => switchAuthMode('login'), 1500);
  } else {
    errDiv.textContent = result.message;
    errDiv.style.display = 'block';
    toast(result.message, 'danger');
  }
}

async function handlePasswordRecovery(e) {
  e.preventDefault();
  
  const email = document.getElementById('recoveryEmail').value;
  const errDiv = document.getElementById('recoveryErr');

  if (!email) {
    errDiv.textContent = 'Email é obrigatório';
    errDiv.style.display = 'block';
    return;
  }

  toast('Enviando link de recuperação...', 'loading');
  errDiv.style.display = 'none';

  const result = await authService.requestPasswordReset(email);

  if (result.success) {
    toast('Link enviado para ' + email, 'success');
    setTimeout(() => switchAuthMode('login'), 1500);
  } else {
    errDiv.textContent = result.message;
    errDiv.style.display = 'block';
    toast(result.message, 'danger');
  }
}

// ========== ACCOUNT MENU ==========

function toggleAccountMenu() {
  const menu = document.getElementById('accMenu');
  const user = window.sessionManager?.getUser();
  
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    if (menu.style.display === 'block' && user) {
      document.getElementById('accName').textContent = user.nome;
      document.getElementById('accRole').textContent = (user.role || 'MEMBRO').toUpperCase();
    }
  }
}

function logout() {
  authService.logout();
  toast('Logout realizado', 'success');
  setTimeout(() => showScreen('auth'), 500);
}

// ========== HOUSEHOLDS ==========

async function loadHouseholds() {
  const user = window.sessionManager?.getUser();
  if (!user) {
    toast('Sessão expirada', 'danger');
    showScreen('auth');
    return;
  }

  const list = document.getElementById('hhList');
  if (!list) return;

  toast('Carregando lojas...', 'loading');
  
  // Carregar de API
  const result = await dataService.getHouseholds();
  
  if (!result.success) {
    toast(result.message, 'danger');
    list.innerHTML = '<div class="empty">Erro ao carregar lojas</div>';
    return;
  }

  const households = result.data || [];

  if (households.length === 0) {
    list.innerHTML = '<div class="empty">Nenhuma loja. Clique em "+ Adicionar Loja" para começar!</div>';
    return;
  }

  list.innerHTML = households.map(hh => `
    <div class="hh-card" onclick="selectHousehold('${hh.id}')">
      <div>
        <div class="hh-name">${hh.nome}</div>
        <div class="hh-meta">${hh.items_count || 0} items</div>
      </div>
      <div class="hh-actions">
        <button class="hh-icon" onclick="event.stopPropagation(); editHousehold('${hh.id}')">✏️</button>
        <button class="hh-icon" onclick="event.stopPropagation(); deleteHousehold('${hh.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
  
  toast('Lojas carregadas!', 'success');
}

function selectHousehold(hhId) {
  localStorage.setItem('hhId', hhId);
  localStorage.setItem('householdName', 'Loja ' + hhId);
  document.getElementById('householdBadge').textContent = 'Loja ' + hhId;
  document.getElementById('householdBadge').style.display = 'inline-block';
  showScreen('app');
}

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

// ========== ITEMS ==========

async function loadItems() {
  const hhId = localStorage.getItem('hhId');
  if (!hhId) {
    toast('Nenhuma loja selecionada', 'danger');
    return;
  }

  const container = document.getElementById('itemsContainer');
  if (!container) return;

  toast('Carregando itens...', 'loading');
  
  // Carregar de API
  const result = await dataService.getItems(hhId);
  
  if (!result.success) {
    toast(result.message, 'danger');
    container.innerHTML = '<div class="empty">Erro ao carregar itens</div>';
    return;
  }

  const items = result.data || [];
  const total = items.length;
  const checked = items.filter(i => i.checked).length;

  container.innerHTML = `
    <div class="sec-label">Itens (${checked}/${total})</div>
    <ul class="items">
      ${items.map(item => `
        <li class="item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
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
  
  toast('Itens carregados!', 'success');
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

// ========== MODALS ==========

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modalId);
    });
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

function openSettings() {
  openModal('settingsModal');
  switchSettingsTab('profile');
}

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

function handleProfileUpdate(e) {
  e.preventDefault();
  toast('Perfil atualizado (Fase 4)', 'success');
  closeModal('settingsModal');
}

function handleOrgUpdate(e) {
  e.preventDefault();
  toast('Organização atualizada (Fase 4)', 'success');
}

function switchAuthMode(modeName) {
  document.querySelectorAll('.auth-mode-screen').forEach(screen => {
    screen.style.display = 'none';
  });
  const screen = document.getElementById(`${modeName}Screen`);
  if (screen) screen.style.display = 'block';
}

// ========== TOAST ==========

function toast(message, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = message;
  el.className = 'show ' + type;
  
  if (type !== 'loading') {
    setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', initApp);
