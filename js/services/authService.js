/**
 * authService.js - FASE 3
 * Serviço de autenticação integrado com Google Apps Script
 * Handles login, register, token refresh, logout
 */

class AuthService {
  constructor(apiUrl = 'https://script.google.com/macros/s/AKfycbwI9Z0vGVkddzLd6DOrE4DGtdw-sTcwlMfGcldJR42txmRVVrhVcXrEakPn4-Ujfr0/exec') {
    this.apiUrl = apiUrl;
    this.sessionManager = null;
  }

  /**
   * Injetar dependência de sessionManager
   */
  setSessionManager(sm) {
    this.sessionManager = sm;
  }

  /**
   * LOGIN - Autenticar user
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.toLowerCase(),
          password: password
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Salvar sessão
      if (this.sessionManager && data.user && data.accessToken) {
        this.sessionManager.saveSession(
          data.user,
          data.accessToken,
          data.refreshToken
        );
        
        // Atualizar permission manager
        if (window.permissionManager) {
          window.permissionManager.setUser(data.user);
        }
      }

      return {
        success: true,
        user: data.user,
        message: 'Login bem-sucedido'
      };
    } catch (error) {
      console.error('Erro em login:', error);
      return {
        success: false,
        message: error.message || 'Erro ao fazer login'
      };
    }
  }

  /**
   * REGISTER - Criar nova conta
   */
  async register(name, email, password) {
    try {
      if (!name || !email || !password) {
        throw new Error('Nome, email e senha são obrigatórios');
      }

      if (password.length < 8) {
        throw new Error('Senha deve ter no mínimo 8 caracteres');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: name.trim(),
          email: email.toLowerCase(),
          password: password
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      return {
        success: true,
        message: 'Conta criada! Faça login para continuar.'
      };
    } catch (error) {
      console.error('Erro em register:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar conta'
      };
    }
  }

  /**
   * REFRESH TOKEN - Renovar access token expirado
   */
  async refreshToken() {
    try {
      if (!this.sessionManager) {
        throw new Error('SessionManager não configurado');
      }

      const session = this.sessionManager.getSession();
      if (!session || !session.refresh_token) {
        throw new Error('Nenhum refresh token disponível');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refreshToken',
          refreshToken: session.refresh_token
        })
      });

      const data = await response.json();

      if (!data.success) {
        // Token inválido, fazer logout
        this.sessionManager.logout();
        throw new Error('Token expirado. Faça login novamente.');
      }

      // Atualizar com novo token
      const user = session.user;
      this.sessionManager.saveSession(
        user,
        data.accessToken,
        data.refreshToken || session.refresh_token
      );

      return {
        success: true,
        accessToken: data.accessToken
      };
    } catch (error) {
      console.error('Erro em refreshToken:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * LOGOUT
   */
  logout() {
    try {
      if (this.sessionManager) {
        this.sessionManager.logout();
      }
      if (window.permissionManager) {
        window.permissionManager.clear?.();
      }
      return { success: true };
    } catch (error) {
      console.error('Erro em logout:', error);
      return { success: false };
    }
  }

  /**
   * PASSWORD RECOVERY - Enviar link de reset
   */
  async requestPasswordReset(email) {
    try {
      if (!email) {
        throw new Error('Email é obrigatório');
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'requestPasswordReset',
          email: email.toLowerCase()
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao solicitar reset');
      }

      return {
        success: true,
        message: 'Link de recuperação enviado para ' + email
      };
    } catch (error) {
      console.error('Erro em requestPasswordReset:', error);
      return {
        success: false,
        message: error.message || 'Erro ao solicitar reset'
      };
    }
  }

  /**
   * VERIFY TOKEN - Verificar se token é válido
   */
  async verifyToken(token) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyToken',
          token: token
        })
      });

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Erro em verifyToken:', error);
      return false;
    }
  }

  /**
   * GET CURRENT USER - Restaurar sessão
   */
  getCurrentUser() {
    if (!this.sessionManager) return null;
    return this.sessionManager.getUser();
  }

  /**
   * IS AUTHENTICATED - Verificar se user está logado
   */
  isAuthenticated() {
    if (!this.sessionManager) return false;
    return this.sessionManager.isAuthenticated();
  }
}

// Instância global
const authService = new AuthService();
