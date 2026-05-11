# Plano — Versão 2.6.4 + PWA Pro + LGPD

## 1. Sistema de versionamento global

Criar `src/lib/app-version.ts`:
```ts
export const APP_VERSION = "2.6.4";
export const APP_VERSION_BUILD = Date.now();
```

Sincronizar a versão em:
- `public/manifest.json` → adicionar `"version": "2.6.4"`
- `public/service-worker.js` → `CACHE_VERSION = "v2.6.4"`
- `index.html` → `<meta name="app-version" content="2.6.4">`
- Footer público (landing/sobre/conheca/blog/login)
- Painel admin (rodapé do `MainLayout` + `AdminSettingsPage`)
- `ChangelogPage` → adicionar entry 2.6.4
- Logs internos (console boot log com versão)

Criar `public/version.json` servido sem cache para detecção de updates:
```json
{ "version": "2.6.4", "build": "<timestamp>" }
```

## 2. Service Worker profissional

Reescrever `public/service-worker.js`:
- `CACHE_VERSION = "afleur-v2.6.4"`
- `install` → `skipWaiting()` + precache mínimo (só shell offline)
- `activate` → deletar todos os caches que não batem com versão atual + `clients.claim()`
- Estratégias por tipo:
  - HTML/navegação → **NetworkFirst** (timeout 3s, nunca servir stale como default)
  - JS/CSS estáticos com hash → **StaleWhileRevalidate**
  - imagens → **CacheFirst** (max 60 entries)
  - fontes Google → **CacheFirst** longo
  - APIs Supabase (`/rest/`, `/auth/`, `/functions/`, `/storage/`) → **NEVER cache** (passthrough)
- Mensagem `SKIP_WAITING` para forçar ativação
- Manter guard atual de iframe/preview (não registrar no editor)

## 3. Gerenciador de updates (PWA Manager)

Criar `src/lib/pwa/registerSW.ts`:
- Registra SW só fora de iframe/preview/dev
- `addEventListener("controllerchange")` → `window.location.reload()` (uma vez)
- Polling `version.json` a cada 5min + on focus → se versão difere, força `registration.update()`

Criar `src/components/pwa/UpdateAvailableModal.tsx`:
- Detecta `waiting` SW
- Modal elegante: título "Nova versão disponível" + texto institucional + botão "Atualizar agora"
- Botão envia `postMessage({type:"SKIP_WAITING"})` ao SW

Integrar em `App.tsx` (montado no root, fora dos layouts).

## 4. LGPD — Sistema de consentimento

Criar arquitetura desacoplada em `src/lib/consent/`:
- `types.ts` — `ConsentCategories = { necessary, functional, analytics, marketing, personalization }`
- `consentStorage.ts` — persiste em `localStorage` `agendafleur_consent` com `{ version, date, choices }`. Versão do termo: `CONSENT_VERSION = "1.0.0"`. Expira em 12 meses.
- `ConsentContext.tsx` — provider React expondo `consent`, `setConsent`, `acceptAll`, `rejectOptional`, `revoke`, `openPreferences`
- `scriptLoader.ts` — utilitário que só injeta scripts (GA, Meta, Hotjar, Clarity) após consentimento da categoria correspondente

Componentes em `src/components/consent/`:
- `ConsentBanner.tsx` — banner inferior moderno, backdrop-blur, 3 botões: Aceitar todos / Recusar opcionais / Personalizar. Não exibe se já houver consentimento válido.
- `ConsentPreferencesModal.tsx` — modal com as 5 categorias, switch + descrição/finalidade/exemplo, "Necessários" desabilitado e on. Salva escolhas granulares.
- `ConsentFloatingButton.tsx` — botão fixo "Preferências de Privacidade" canto inferior esquerdo, só nas páginas públicas.

Integração:
- Provider em `App.tsx`
- Banner + botão flutuante renderizam só em rotas públicas (detectar via `useLocation`)
- Páginas novas: `/politica-privacidade` e `/politica-cookies` com conteúdo LGPD pt-BR completo, links no footer e no banner.

## 5. Revisão páginas públicas

Páginas existentes a revisar (preservar comportamento, melhorar consistência):
- `LandingPage`, `SobrePage`, `HomePage`, `LoginPage`, `ResetPasswordPage`, `BlogListPage`, `BlogPostPage`, `BlogCategoriaPage`, `NotFound`

Padronização:
- Header já existe (`SiteHeader`). Criar `SiteFooter.tsx` reutilizável: links institucionais, blog, política privacidade, cookies, "Preferências de Privacidade", versão `v2.6.4`, copyright.
- Aplicar `SiteFooter` em todas as páginas públicas que ainda não têm um footer consistente.
- Lazy-load de páginas pesadas em `App.tsx` via `React.lazy` (Landing, Blog).
- `loading="lazy"` + `decoding="async"` em imagens não-críticas; `fetchPriority="high"` no hero LCP.
- Garantir `prefers-reduced-motion` respeitado em animações.
- Dark mode: trocar quaisquer cores hardcoded restantes por tokens.

## 6. Painel admin

- `MainLayout` rodapé pequeno: "Agenda Fleur v2.6.4"
- `AdminSettingsPage` ou `AdminPage` exibir bloco "Versão do sistema: 2.6.4 · build #xxxx · Atualizar agora"
- Console log no boot: `console.info("[Agenda Fleur] v2.6.4")`

## 7. SEO/meta

- `index.html`: adicionar `<meta name="app-version" content="2.6.4">`
- Sem alterar títulos/canonicals existentes.

## 8. Não-objetivos (não tocar)

- Banco de dados, RLS, edge functions, integrações financeiras (Inter, Asaas), auth, blog DB, sidebar config, rotas autenticadas — preservados integralmente.
- CSP via headers HTTP fica fora (não temos controle de servidor); apenas documentar.

## Arquivos

**Criar:**
- `src/lib/app-version.ts`
- `src/lib/pwa/registerSW.ts`
- `src/lib/pwa/useUpdateAvailable.ts`
- `src/components/pwa/UpdateAvailableModal.tsx`
- `src/lib/consent/types.ts`
- `src/lib/consent/consentStorage.ts`
- `src/lib/consent/ConsentContext.tsx`
- `src/lib/consent/scriptLoader.ts`
- `src/components/consent/ConsentBanner.tsx`
- `src/components/consent/ConsentPreferencesModal.tsx`
- `src/components/consent/ConsentFloatingButton.tsx`
- `src/components/landing/SiteFooter.tsx`
- `src/pages/PoliticaPrivacidadePage.tsx`
- `src/pages/PoliticaCookiesPage.tsx`
- `public/version.json`

**Editar:**
- `public/service-worker.js` (reescrita)
- `public/manifest.json` (version)
- `index.html` (meta version + boot log)
- `src/main.tsx` (boot log + register SW)
- `src/App.tsx` (provider consent + modal update + rotas políticas)
- `src/components/layout/MainLayout.tsx` (footer versão)
- `src/pages/AdminSettingsPage.tsx` (bloco versão)
- `src/pages/ChangelogPage.tsx` (entry 2.6.4)
- Páginas públicas listadas → adicionar `SiteFooter`

## Critério de pronto

- Versão 2.6.4 visível em footer público, admin, console, manifest, meta tag.
- Ao publicar, usuários antigos recebem modal "Nova versão" e atualizam com 1 clique; sem precisar limpar cache.
- Banner LGPD aparece para visitantes sem consentimento; preferências persistem; botão flutuante reabre central.
- Nenhuma rota autenticada, integração ou tabela alterada.
