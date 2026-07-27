// Глобальный middleware: добавляет заголовки безопасности ко ВСЕМ ответам.
// Возврат ответа с "x-middleware-next: 1" = пропустить дальше, но применить
// перечисленные заголовки к финальному ответу (страницы и API).

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export function proxy(): Response {
  const headers = new Headers();
  headers.set("x-middleware-next", "1");
  // Запрет встраивания в iframe (кликджекинг)
  headers.set("X-Frame-Options", "DENY");
  // Запрет угадывания MIME-типа
  headers.set("X-Content-Type-Options", "nosniff");
  // Не утекать полный URL при переходах на другие сайты
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Принудительный HTTPS на год
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Отключить доступ к камере/микрофону/гео/оплате
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  // Ограничить источники ресурсов и запретить внешние подключения
  headers.set("Content-Security-Policy", CSP);
  return new Response(null, { headers });
}
