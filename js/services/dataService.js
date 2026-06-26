/**
 * dataService.js - FASE 3
 * Serviço de dados (CRUD) integrado com Google Apps Script
 * Handles: itens, lojas (households), membros
 */

class DataService {
  constructor(apiUrl = 'https://script.google.com/macros/s/AKfycbwI9Z0vGVkddzLd6DOrE4DGtdw-sTcwlMfGcldJR42txmRVVrhVcXrEakPn4-Ujfr0/exec') {
    this.apiUrl = apiUrl;
    this.cache = {
      households: null,
      items: null
    };
  }

  /**
   * Helper: Fazer fetch autenticado
   */
  async _fetch(action, data = {}) {
    try {
      const session = window.sessionManager?.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: action,
          ...data
        })
      });

      const result = await response.json();

      // Se token expirou, renovar
      if (response.status === 401) {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          return this._fetch(action, data); // Retry
        } else {
          throw new Error('Sessão expirada');
        }
      }

      if (!result.success) {
        throw new Error(result.message || `Erro em ${action}`);
      }

      return result;
    } catch (error) {
      console.error(`Erro em _fetch(${action}):`, error);
      throw error;
    }
  }

  /**
   * HOUSEHOLDS (LOJAS)
   */
  
  async getHouseholds() {
    try {
      const result = await this._fetch('getHouseholds');
      this.cache.households = result.data || [];
      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async addHousehold(nome, descricao = '') {
    try {
      if (!nome || nome.length < 3) {
        throw new Error('Nome da loja deve ter no mínimo 3 caracteres');
      }

      const result = await this._fetch('addHousehold', {
        nome: nome.trim(),
        descricao: descricao.trim()
      });

      // Limpar cache
      this.cache.households = null;

      return {
        success: true,
        data: result.data,
        message: 'Loja criada com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async updateHousehold(hhId, nome, descricao = '') {
    try {
      const result = await this._fetch('updateHousehold', {
        hhId: hhId,
        nome: nome.trim(),
        descricao: descricao.trim()
      });

      this.cache.households = null;

      return {
        success: true,
        message: 'Loja atualizada'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async deleteHousehold(hhId) {
    try {
      await this._fetch('deleteHousehold', { hhId });
      this.cache.households = null;
      
      return {
        success: true,
        message: 'Loja deletada'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * ITEMS (ITENS)
   */

  async getItems(hhId) {
    try {
      const result = await this._fetch('getItems', { hhId });
      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async addItem(hhId, nome, qty, unit, category) {
    try {
      if (!nome || nome.length < 2) {
        throw new Error('Nome do item é obrigatório');
      }

      const result = await this._fetch('addItem', {
        hhId: hhId,
        nome: nome.trim(),
        qty: qty || 1,
        unit: unit || 'un',
        category: category || 'Geral'
      });

      return {
        success: true,
        data: result.data,
        message: 'Item adicionado'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async updateItem(itemId, updates) {
    try {
      const result = await this._fetch('updateItem', {
        itemId: itemId,
        ...updates
      });

      return {
        success: true,
        message: 'Item atualizado'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async deleteItem(itemId) {
    try {
      await this._fetch('deleteItem', { itemId });
      
      return {
        success: true,
        message: 'Item deletado'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async toggleItem(itemId, checked) {
    try {
      const result = await this._fetch('toggleItem', {
        itemId: itemId,
        checked: !!checked
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * SEARCH ITEMS
   */
  async searchItems(hhId, term) {
    try {
      const result = await this._fetch('searchItems', {
        hhId: hhId,
        term: term.trim()
      });

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  /**
   * CLEAR CACHE
   */
  clearCache() {
    this.cache.households = null;
    this.cache.items = null;
  }
}

// Instância global
const dataService = new DataService();
