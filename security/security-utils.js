/**
 * Security Utilities for Decoimp - VERSION CORREGIDA
 * Protección frontend que NO interfiere con componentes
 */

class DecoSecurity {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Esperar a que los componentes se carguen primero
        setTimeout(() => {
            this.setupProtections();
            this.initialized = true;
            console.log('🔒 Security protections activated (delayed)');
        }, 1000);
    }

    setupProtections() {
        this.protectForms();
        this.detectSuspiciousActivity();
        this.addSecurityObservers();
    }

    // SOLO proteger formularios existentes
    protectForms() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            
            if (this.detectSpam(form)) {
                e.preventDefault();
                this.showSecurityMessage('Formulario bloqueado por seguridad');
                return;
            }

            if (!this.checkRateLimit()) {
                e.preventDefault();
                this.showSecurityMessage('Por favor espere antes de enviar otro formulario');
                return;
            }
        });

        // Protección para formulario modal cuando se carga
        this.setupModalProtection();
    }

    setupModalProtection() {
        // Observar cuando se carga el modal
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.id === 'consultaModal') {
                        this.enhanceFormSecurity(node);
                    }
                });
            });
        });

        modalObserver.observe(document.body, {
            childList: true,
            subtree: false
        });
    }

    enhanceFormSecurity(modal) {
        const form = modal.querySelector('#formConsulta');
        if (!form) return;

        // Agregar campo honeypot anti-bots
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.style.display = 'none';
        honeypot.className = 'hp-field';
        form.appendChild(honeypot);

        // Validación en tiempo real
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });
    }

    validateField(field) {
        const value = field.value;
        
        if (field.type === 'email' && value && !this.isValidEmail(value)) {
            field.setCustomValidity('Por favor ingrese un email válido');
        } else if (field.type === 'tel' && value && !this.isValidPhone(value)) {
            field.setCustomValidity('Por favor ingrese un teléfono válido');
        } else {
            field.setCustomValidity('');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
        return phoneRegex.test(phone);
    }

    detectSpam(form) {
        const honeypot = form.querySelector('.hp-field');
        return honeypot && honeypot.value !== '';
    }

    checkRateLimit() {
        const now = Date.now();
        const lastSubmit = localStorage.getItem('last_form_submit');
        
        if (lastSubmit && (now - parseInt(lastSubmit)) < 10000) {
            return false;
        }
        
        localStorage.setItem('last_form_submit', now.toString());
        return true;
    }

    detectSuspiciousActivity() {
        // Detectar links javascript: peligrosos
        document.addEventListener('click', (e) => {
            if (e.target.href && e.target.href.includes('javascript:')) {
                e.preventDefault();
                console.warn('🔒 Blocked suspicious link');
            }
        });
    }

    addSecurityObservers() {
        // Observar cambios en el DOM para proteger nuevos elementos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.sanitizeNewContent(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    sanitizeNewContent(node) {
        // Solo remover scripts claramente maliciosos
        const scripts = node.querySelectorAll('script');
        scripts.forEach(script => {
            const src = script.getAttribute('src') || '';
            if (src.includes('malicious') || src.includes('hack')) {
                script.remove();
                console.warn('🔒 Removed unsafe script');
            }
        });
    }

    showSecurityMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'security-alert';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        alert.textContent = message;

        document.body.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
}

// Inicializar seguridad después de que todo cargue
window.addEventListener('load', () => {
    window.decoSecurity = new DecoSecurity();
    window.decoSecurity.init();
});