/**
 * Security Utilities for Decoimp
 * Protección frontend transparente
 */

class DecoSecurity {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar protecciones cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupProtections());
        } else {
            this.setupProtections();
        }
    }

    setupProtections() {
        this.preventXSS();
        this.sanitizeDynamicContent();
        this.protectForms();
        this.detectSuspiciousActivity();
        console.log('🔒 Security protections activated');
    }

    // Prevenir ataques XSS en contenido dinámico
    preventXSS() {
        // Sanitizar todo el contenido cargado dinámicamente
        const sanitizeHTML = (str) => {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        };

        // Interceptar innerHTML en contenedores de componentes
        ['header-container', 'home-container', 'about-container', 
         'services-container', 'sectores-container', 'footer-container'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
                
                Object.defineProperty(container, 'innerHTML', {
                    set: function(value) {
                        const sanitized = sanitizeHTML(value);
                        originalInnerHTML.set.call(this, sanitized);
                    },
                    get: function() {
                        return originalInnerHTML.get.call(this);
                    }
                });
            }
        });
    }

    // Sanitizar contenido que se carga dinámicamente
    sanitizeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        this.sanitizeNode(node);
                    }
                });
            });
        });

        // Observar todo el documento
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    sanitizeNode(node) {
        // Remover scripts maliciosos
        const scripts = node.querySelectorAll('script');
        scripts.forEach(script => {
            // Verificar si el script es legítimo
            const src = script.getAttribute('src') || '';
            if (!this.isSafeScript(src)) {
                script.remove();
                console.warn('🔒 Removed potentially unsafe script');
            }
        });

        // Sanitizar event handlers peligrosos
        const elements = node.querySelectorAll('*');
        elements.forEach(el => {
            const attrs = el.attributes;
            for (let attr of attrs) {
                // Remover event handlers inline (onclick, onload, etc.)
                if (attr.name.startsWith('on') && 
                    !attr.name.includes('safe') && 
                    !el.classList.contains('trusted')) {
                    el.removeAttribute(attr.name);
                }
                
                // Remover javascript: en links
                if (attr.value && attr.value.toLowerCase().includes('javascript:')) {
                    el.removeAttribute(attr.name);
                }
            }
        });
    }

    isSafeScript(src) {
        // Lista de scripts seguros (CDNs confiables)
        const safeSources = [
            'assets/js/',
            'https://cdnjs.cloudflare.com/',
            'https://ajax.googleapis.com/'
        ];
        
        return safeSources.some(safe => src.includes(safe)) || src === '';
    }

    // Protección de formularios
    protectForms() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            
            // Validación básica anti-spam
            if (this.detectSpam(form)) {
                e.preventDefault();
                this.showSecurityMessage('Formulario bloqueado por seguridad');
                return;
            }

            // Rate limiting básico
            if (!this.checkRateLimit()) {
                e.preventDefault();
                this.showSecurityMessage('Por favor espere antes de enviar otro formulario');
                return;
            }

            // Sanitizar datos antes del envío
            this.sanitizeFormData(form);
        });

        // Protección adicional para el formulario modal
        this.protectModalForm();
    }

    protectModalForm() {
        // Cuando se carga el formulario modal, aplicar protecciones
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

        // Agregar timestamp para prevenir reenvíos
        const timestamp = document.createElement('input');
        timestamp.type = 'hidden';
        timestamp.name = 'timestamp';
        timestamp.value = Date.now();
        form.appendChild(timestamp);

        // Validación en tiempo real
        form.addEventListener('input', (e) => {
            this.validateField(e.target);
        });
    }

    validateField(field) {
        const value = field.value;
        
        // Prevenir XSS en campos de texto
        if (field.type === 'text' || field.type === 'textarea') {
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi
            ];
            
            dangerousPatterns.forEach(pattern => {
                if (pattern.test(value)) {
                    field.value = value.replace(pattern, '');
                    this.showSecurityMessage('Caracteres no permitidos detectados');
                }
            });
        }

        // Validación específica por tipo de campo
        switch(field.type) {
            case 'email':
                if (!this.isValidEmail(value) && value !== '') {
                    field.setCustomValidity('Por favor ingrese un email válido');
                } else {
                    field.setCustomValidity('');
                }
                break;
                
            case 'tel':
                if (!this.isValidPhone(value) && value !== '') {
                    field.setCustomValidity('Por favor ingrese un teléfono válido');
                } else {
                    field.setCustomValidity('');
                }
                break;
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
        if (honeypot && honeypot.value !== '') {
            return true; // Bot detectado
        }

        // Detectar envíos demasiado rápidos (menos de 3 segundos)
        const timestamp = form.querySelector('input[name="timestamp"]');
        if (timestamp) {
            const submitTime = Date.now();
            const formTime = parseInt(timestamp.value);
            if (submitTime - formTime < 3000) {
                return true; // Posible bot
            }
        }

        return false;
    }

    checkRateLimit() {
        const now = Date.now();
        const lastSubmit = localStorage.getItem('last_form_submit');
        
        if (lastSubmit && (now - parseInt(lastSubmit)) < 10000) { // 10 segundos
            return false;
        }
        
        localStorage.setItem('last_form_submit', now.toString());
        return true;
    }

    sanitizeFormData(form) {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type !== 'password') {
                input.value = this.sanitizeString(input.value);
            }
        });
    }

    sanitizeString(str) {
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Detección de actividad sospechosa
    detectSuspiciousActivity() {
        // Monitorizar eventos inusuales
        document.addEventListener('click', (e) => {
            if (e.target.href && e.target.href.includes('javascript:')) {
                e.preventDefault();
                console.warn('🔒 Blocked suspicious link:', e.target.href);
            }
        });

        // Detectar iframes no deseados
        const checkIframes = () => {
            document.querySelectorAll('iframe').forEach(iframe => {
                const src = iframe.src || '';
                if (!this.isSafeIframe(src)) {
                    iframe.remove();
                    console.warn('🔒 Removed unsafe iframe');
                }
            });
        };

        // Ejecutar periódicamente
        setInterval(checkIframes, 5000);
        checkIframes();
    }

    isSafeIframe(src) {
        const safeDomains = [
            'google.com',
            'youtube.com',
            'maps.google.com',
            'tudominio.com' // agregar tu dominio
        ];
        
        return safeDomains.some(domain => src.includes(domain));
    }

    showSecurityMessage(message) {
        // Mostrar mensaje de seguridad de forma discreta
        const existingMsg = document.querySelector('.security-alert');
        if (existingMsg) existingMsg.remove();

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

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
}

// Inicializar seguridad automáticamente
if (typeof window !== 'undefined') {
    window.decoSecurity = new DecoSecurity();
}