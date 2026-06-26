/**
 * validators.js - FASE 3
 * Validações client-side (antes de enviar pro servidor)
 */

class Validators {
  /**
   * Email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Password - Mínimo 8 chars
   */
  static isValidPassword(pwd) {
    if (!pwd || pwd.length < 8) {
      return {
        valid: false,
        message: 'Senha deve ter no mínimo 8 caracteres'
      };
    }
    return { valid: true };
  }

  /**
   * Name - 3-50 chars
   */
  static isValidName(name) {
    const trimmed = name?.trim() || '';
    if (trimmed.length < 3) {
      return {
        valid: false,
        message: 'Nome deve ter no mínimo 3 caracteres'
      };
    }
    if (trimmed.length > 50) {
      return {
        valid: false,
        message: 'Nome não pode ter mais de 50 caracteres'
      };
    }
    return { valid: true };
  }

  /**
   * Item Name - 2-80 chars
   */
  static isValidItemName(name) {
    const trimmed = name?.trim() || '';
    if (trimmed.length < 2) {
      return {
        valid: false,
        message: 'Nome do item deve ter no mínimo 2 caracteres'
      };
    }
    if (trimmed.length > 80) {
      return {
        valid: false,
        message: 'Nome do item não pode ter mais de 80 caracteres'
      };
    }
    return { valid: true };
  }

  /**
   * Quantity
   */
  static isValidQuantity(qty) {
    const num = parseFloat(qty);
    if (isNaN(num) || num <= 0) {
      return {
        valid: false,
        message: 'Quantidade deve ser maior que 0'
      };
    }
    return { valid: true };
  }

  /**
   * Category - 2-30 chars
   */
  static isValidCategory(cat) {
    const trimmed = cat?.trim() || '';
    if (trimmed.length < 2) {
      return {
        valid: false,
        message: 'Categoria deve ter no mínimo 2 caracteres'
      };
    }
    if (trimmed.length > 30) {
      return {
        valid: false,
        message: 'Categoria não pode ter mais de 30 caracteres'
      };
    }
    return { valid: true };
  }

  /**
   * FORM VALIDATORS
   */

  static validateLoginForm(email, password) {
    const errors = {};

    if (!email) {
      errors.email = 'Email é obrigatório';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email inválido';
    }

    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      errors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  static validateRegisterForm(name, email, password, confirmPassword) {
    const errors = {};

    const nameCheck = this.isValidName(name);
    if (!nameCheck.valid) errors.name = nameCheck.message;

    if (!email) {
      errors.email = 'Email é obrigatório';
    } else if (!this.isValidEmail(email)) {
      errors.email = 'Email inválido';
    }

    const pwdCheck = this.isValidPassword(password);
    if (!pwdCheck.valid) errors.password = pwdCheck.message;

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Senhas não correspondem';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  static validateItemForm(nome, qty, category) {
    const errors = {};

    const nameCheck = this.isValidItemName(nome);
    if (!nameCheck.valid) errors.nome = nameCheck.message;

    const qtyCheck = this.isValidQuantity(qty);
    if (!qtyCheck.valid) errors.qty = qtyCheck.message;

    const catCheck = this.isValidCategory(category);
    if (!catCheck.valid) errors.category = catCheck.message;

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  static validateHouseholdForm(nome, descricao = '') {
    const errors = {};

    const nameCheck = this.isValidName(nome);
    if (!nameCheck.valid) errors.nome = nameCheck.message;

    if (descricao && descricao.length > 200) {
      errors.descricao = 'Descrição não pode ter mais de 200 caracteres';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  }
}

// Aliases globais úteis
const V = Validators;
