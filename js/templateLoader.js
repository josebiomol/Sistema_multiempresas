/**
 * templateLoader.js
 * Carrega e gerencia templates HTML dinamicamente
 */

class TemplateLoader {
  constructor(basePath = 'templates/') {
    this.basePath = basePath;
    this.cache = {};
  }

  /**
   * Carregar template via fetch
   */
  async load(templateName) {
    if (this.cache[templateName]) {
      return this.cache[templateName];
    }

    try {
      const response = await fetch(`${this.basePath}${templateName}.html`);
      if (!response.ok) throw new Error(`Template ${templateName} não encontrado`);
      
      const html = await response.text();
      this.cache[templateName] = html;
      return html;
    } catch (error) {
      console.error(`Erro ao carregar template ${templateName}:`, error);
      return null;
    }
  }

  /**
   * Carregar múltiplos templates
   */
  async loadMultiple(templateNames) {
    const promises = templateNames.map(name => this.load(name));
    return Promise.all(promises);
  }

  /**
   * Injetar template no DOM (ACUMULA, não sobrescreve)
   */
  async inject(templateName, targetSelector) {
    const html = await this.load(templateName);
    if (!html) return false;

    const target = document.querySelector(targetSelector);
    if (!target) {
      console.error(`Target ${targetSelector} não encontrado`);
      return false;
    }

    // ✅ ACUMULAR templates (não sobrescrever)
    target.insertAdjacentHTML('beforeend', html);
    return true;
  }

  /**
   * Injetar múltiplos templates
   */
  async injectMultiple(templates) {
    const promises = templates.map(({ template, target }) => 
      this.inject(template, target)
    );
    return Promise.all(promises);
  }

  /**
   * Render template com variáveis
   */
  render(html, variables = {}) {
    let result = html;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Clone template com dados
   */
  cloneTemplate(templateSelector, variables = {}) {
    const template = document.querySelector(templateSelector);
    if (!template) return null;

    let html = template.innerHTML;
    return this.render(html, variables);
  }
}

// Instância global
const templates = new TemplateLoader('templates/');

/**
 * Helper para injetar templates durante init
 */
async function loadAppTemplates() {
  await templates.injectMultiple([
    { template: 'auth', target: '#root' },
    { template: 'households', target: '#root' },
    { template: 'app', target: '#root' },
    { template: 'modals/editItem', target: 'body' },
    { template: 'modals/editUser', target: 'body' },
    { template: 'modals/settings', target: 'body' },
    { template: 'modals/addHousehold', target: 'body' }
  ]);
  // ✅ NÃO chama showScreen() - deixa main.js controlar
}

/**
 * Gerenciar visibilidade de telas
 */
function showScreen(screenName) {
  // Esconder todas as telas
  document.getElementById('authScreen')?.style.setProperty('display', 'none');
  document.getElementById('householdsScreen')?.style.setProperty('display', 'none');
  document.getElementById('appScreen')?.style.setProperty('display', 'none');

  // Mostrar tela solicitada
  const screen = document.getElementById(`${screenName}Screen`);
  if (screen) {
    screen.style.display = 'flex';
  }

  // Carregar dados ao abrir a tela
  if (screenName === 'households' && typeof loadHouseholds === 'function') {
    loadHouseholds();
  } else if (screenName === 'app' && typeof loadItems === 'function') {
    loadItems();
  }
}

/**
 * Gerenciar modais
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

/**
 * Switch entre abas de settings
 */
function switchSettingsTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.settings-tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });

  // Remove active class
  document.querySelectorAll('.settings-tab').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tab = document.getElementById(`${tabName}Tab`);
  if (tab) tab.classList.remove('hidden');

  // Add active class to button
  event.target?.classList.add('active');
}

/**
 * Switch entre modos de auth
 */
function switchAuthMode(modeName) {
  document.querySelectorAll('.auth-mode-screen').forEach(screen => {
    screen.style.display = 'none';
  });

  const screen = document.getElementById(`${modeName}Screen`);
  if (screen) screen.style.display = 'block';
}

/**
 * Gerenciar expansão de formulário
 */
function toggleAddExtra() {
  const btn = document.getElementById('expandBtn');
  const extra = document.getElementById('addExtra');
  if (btn && extra) {
    btn.classList.toggle('open');
    extra.classList.toggle('show');
  }
}

/**
 * Limpar formulário de busca
 */
function clearSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchClear');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (btn) btn.style.display = 'none';
}

// ✅ NÃO inicializar automaticamente - main.js controla
// Estava causando conflito com initApp()
