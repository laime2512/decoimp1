<?php
/**
 * Security Headers para Decoimp
 * Incluir este archivo en páginas PHP
 */

// Headers de seguridad básicos
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: strict-origin-when-cross-origin");

// Content Security Policy (CSP) - Ajustar según necesidades
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com;");

// Prevenir caching de páginas sensibles (opcional)
// header("Cache-Control: no-cache, no-store, must-revalidate");
// header("Pragma: no-cache");
// header("Expires: 0");

// HSTS - Solo habilitar cuando tengas HTTPS
// header("Strict-Transport-Security: max-age=31536000; includeSubDomains");

?>