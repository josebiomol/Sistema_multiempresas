/**
 * main.js - Placeholder FASE 1-2
 * Funções básicas para testar templates + CSS
 * Refatoração completa em Fase 3
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

  // Rate limit check
  const rateLimitCheck = rateLimiter.check(email, 'login');
  if (!rateLimitCheck.allowed) {
    errDiv.textContent = rateLimitCheck.reason;
    errDiv.style.display = 'block';
    return;
  }

  try {
    toast('Entrando...', 'loading');
    
    // Simular login (Fase 3 fará requisição real)
    if (email && password.length >= 6) {
      const user = {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        nome: email.split('@')[0],
        email: email,
        role: 'membro',
        groupName: 'Colaborador'
      };

      const accessToken = 'token_' + Date.now();
      const refreshToken = 'refresh_' + Date.now();

      // Salvar sessão
      window.sessionManager.saveSession(user, accessToken, refreshToken);
      window.permissionManager.setUser(user);

      toast('Login bem-sucedido!', 'success');
      setTimeout(() => showScreen('households'), 1000);
      rateLimiter.reset(email, 'login');
    } else {
      throw new Error('Email ou senha inválidos');
    }
  } catch (error) {
    errDiv.textContent = error.message || 'Erro ao fazer login';
    errDiv.style.display = 'block';
    toast(error.message, 'danger');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const errDiv = document.getElementById('registerErr');

  try {
    if (password.length < 8) {
      throw new Error('Senha deve ter no mínimo 8 caracteres');
    }

    toast('Criando conta...', 'loading');
    
    // Simular registro (Fase 3 fará requisição real)
    setTimeout(() => {
      toast('Conta criada! Faça login.', 'success');
      switchAuthMode('login');
    }, 1000);
  } catch (error) {
    errDiv.textContent = error.message;
    errDiv.style.display = 'block';
    toast(error.message, 'danger');
  }
}

async function handlePasswordRecovery(e) {
  e.preventDefault();
  
  const email = document.getElementById('recoveryEmail').value;
  const errDiv = document.getElementById('recoveryErr');

  try {
    toast('Enviando link de recuperação...', 'loading');
    
    // Simular (Fase 3 fará requisição real)
    setTimeout(() => {
      toast('Link enviado para ' + email, 'success');
      switchAuthMode('login');
    }, 1500);
  } catch (error) {
    errDiv.textContent = error.message;
    errDiv.style.display = 'block';
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
  window.sessionManager?.logout();
  window.permissionManager?.clear();
  toast('Logout realizado', 'success');
  setTimeout(() => showScreen('auth'), 500);
}

// ========== SCREENS ==========
// showScreen() está em templateLoader.js

// ========== HOUSEHOLDS ==========
function loadHouseholds() {
  const user = window.sessionManager?.getUser();
  if (!user) return;

  const list = document.getElementById('hhList');
  if (!list) return;

  // Simular dados (Fase 3 virá da API)
  const households = [
    { id: 'hh-1', nome: 'Loja Centro', items: 12 },
    { id: 'hh-2', nome: 'Loja Norte', items: 8 }
  ];

  list.innerHTML = households.map(hh => `
    <div class="hh-card" onclick="selectHousehold('${hh.id}')">
      <div>
        <div class="hh-name">${hh.nome}</div>
        <div class="hh-meta">${hh.items} items</div>
      </div>
      <div class="hh-actions">
        <button class="hh-icon" onclick="event.stopPropagation(); editHousehold('${hh.id}')">✏️</button>
        <button class="hh-icon" onclick="event.stopPropagation(); deleteHousehold('${hh.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function selectHousehold(hhId) {
  localStorage.setItem('hhId', hhId);
  localStorage.setItem('householdName', 'Loja ' + hhId);
  document.getElementById('householdBadge').textContent = 'Loja ' + hhId;
  document.getElementById('householdBadge').style.display = 'inline-block';
  showScreen('app');
}

function editHousehold(hhId) {
  toast('Editar: ' + hhId, 'info');
}

function deleteHousehold(hhId) {
  if (confirm('Deletar loja?')) {
    toast('Loja deletada', 'success');
    loadHouseholds();
  }
}

function openAddHouseholdModal() {
  toast('Modal adicionar loja (Fase 3)', 'info');
}

// ========== ITEMS ==========
function loadItems() {
  const container = document.getElementById('itemsContainer');
  if (!container) return;

  // Simular dados (Fase 3 virá da API)
  const items = [
    { id: '1', nome: 'Pão francês', category: 'Pães', qty: '500g', checked: false },
    { id: '2', nome: 'Leite integral', category: 'Laticínios', qty: '2l', checked: false },
    { id: '3', nome: 'Ovos', category: 'Proteínas', qty: '30un', checked: true }
  ];

  container.innerHTML = `
    <div class="sec-label">Items (${items.length})</div>
    <ul class="items">
      ${items.map(item => `
        <li class="item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
          <div class="item-check" onclick="toggleItemCheck(event)">✓</div>
          <div class="item-info">
            <p class="item-name">${item.nome}</p>
            <div class="item-meta">
              <span class="item-cat">${item.category}</span>
              ${item.qty}
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
}

function addItem() {
  const input = document.getElementById('itemName');
  if (!input || !input.value) {
    toast('Digite o nome do item', 'danger');
    return;
  }
  
  toast('Item adicionado: ' + input.value, 'success');
  input.value = '';
  loadItems();
}

function toggleItemCheck(e) {
  e.target.closest('.item').classList.toggle('checked');
}

function editItem(itemId) {
  toast('Editar item: ' + itemId + ' (Fase 3)', 'info');
}

function deleteItem(itemId) {
  if (confirm('Deletar item?')) {
    toast('Item deletado', 'success');
    loadItems();
  }
}

function searchItems() {
  const term = document.getElementById('searchInput')?.value || '';
  const btn = document.getElementById('searchClear');
  if (btn) btn.style.display = term ? 'block' : 'none';
  toast('Buscar: ' + term, 'info');
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    input.value = '';
    document.getElementById('searchClear').style.display = 'none';
  }
}

function setStatusFilter(status) {
  document.querySelectorAll('.group-toggle').forEach(btn => btn.classList.remove('active'));
  event.target?.classList.add('active');
  toast('Filtro: ' + status, 'info');
}

function toggleAddExtra() {
  const btn = document.getElementById('expandBtn');
  const extra = document.getElementById('addExtra');
  if (btn && extra) {
    btn.classList.toggle('open');
    extra.classList.toggle('show');
  }
}

// ========== MODALS ==========
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    // Fechar quando clicar fora do modal
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
  toast('Perfil atualizado (Fase 3)', 'success');
  closeModal('settingsModal');
}

function handleOrgUpdate(e) {
  e.preventDefault();
  toast('Organização atualizada (Fase 3)', 'success');
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
// ========== INIT ==========
document.addEventListener('DOMContentLoaded', initApp);
