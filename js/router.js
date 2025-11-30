/**
 * Router para URLs limpias - Decoimp
 * Convierte rutas como /decoimp/service en navegación suave
 */

class AppRouter {
    constructor() {
        this.routes = {
            '': 'home',
            'home': 'home',
            'inicio': 'home',
            'about': 'about',
            'nosotros': 'about', 
            'service': 'service',
            'servicios': 'service',
            'services': 'service',
            'sectores': 'sectores',
            'sectors': 'sectores',
            'contact': 'contact',
            'contacto': 'contact',
            'contactanos': 'contact'
        };
        
        this.init();
    }

    init() {
        // Manejar navegación inicial
        this.handleInitialRoute();
        
        // Manejar clicks en enlaces
        this.setupLinkHandlers();
        
        // Manejar navegación del navegador (atrás/adelante)
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange();
        });
        
        console.log('🔄 Router initialized');
    }

    handleInitialRoute() {
        // Obtener la ruta actual de la URL
        const path = this.getCurrentPath();
        
        if (path && path !== '') {
            // Si hay una ruta específica, navegar a ella
            this.navigateToSection(path, false);
        } else {
            // Si es la raíz, asegurarse de que estamos en el home
            this.updateBrowserUrl('', 'Inicio - Decoimp');
        }
    }

    getCurrentPath() {
        // Obtener la parte de la ruta después del dominio
        const fullPath = window.location.pathname;
        const basePath = fullPath.includes('/decoimp/') ? '/decoimp/' : '/';
        let path = fullPath.replace(basePath, '').replace(/^\//, '').replace(/\/$/, '');
        
        // Remover index.html si está presente
        path = path.replace('index.html', '');
        
        return path;
    }

    navigateToSection(route, updateHistory = true) {
        const sectionId = this.routes[route] || route;
        const targetSection = document.getElementById(sectionId);
        
        if (targetSection) {
            // Scroll suave a la sección
            this.smoothScrollToSection(targetSection);
            
            // Actualizar URL del navegador
            if (updateHistory) {
                this.updateBrowserUrl(route, this.getPageTitle(route));
            }
            
            // Actualizar navegación activa
            this.updateActiveNav(route);
            
            console.log(`📍 Navigated to: ${route} -> #${sectionId}`);
        } else {
            console.warn(`Section not found for route: ${route}`);
            // Si no encuentra la sección, ir al home
            this.navigateToSection('', updateHistory);
        }
    }

    smoothScrollToSection(element) {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    updateBrowserUrl(route, title) {
        const basePath = window.location.pathname.includes('/decoimp/') ? '/decoimp/' : '/';
        const newUrl = route ? `${basePath}${route}` : basePath;
        
        // Actualizar historial sin recargar la página
        window.history.pushState({ route: route }, title, newUrl);
        
        // Actualizar título de la página
        document.title = title;
    }

    getPageTitle(route) {
        const titles = {
            '': 'Decoimp || Imports to Bolivia',
            'home': 'Decoimp || Imports to Bolivia', 
            'about': 'Nosotros - Decoimp',
            'service': 'Servicios - Decoimp',
            'servicios': 'Servicios - Decoimp',
            'sectores': 'Sectores - Decoimp',
            'contact': 'Contacto - Decoimp'
        };
        
        return titles[route] || 'Decoimp || Imports to Bolivia';
    }

    updateActiveNav(route) {
        // Remover clase active de todos los enlaces
        document.querySelectorAll('.nav-link, .page-scroll, .footer-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al enlace correspondiente
        const targetLink = document.querySelector(`[href="#${this.routes[route]}"], [href="/${route}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    setupLinkHandlers() {
        // Manejar clicks en enlaces de navegación
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            
            if (link) {
                const href = link.getAttribute('href');
                
                // Si es un enlace interno que comienza con /
                if (href && href.startsWith('/') && !href.startsWith('//')) {
                    e.preventDefault();
                    
                    // Extraer la ruta (remover / inicial)
                    const route = href.replace(/^\//, '').replace(/\/$/, '');
                    this.navigateToSection(route);
                }
                
                // Si es un enlace con data-route
                else if (link.hasAttribute('data-route')) {
                    e.preventDefault();
                    const route = link.getAttribute('data-route');
                    this.navigateToSection(route);
                }
            }
        });
    }

    handleRouteChange() {
        const path = this.getCurrentPath();
        this.navigateToSection(path, false);
    }
}

// Inicializar router cuando se cargue la página
window.appRouter = new AppRouter();