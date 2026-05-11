import { APP_VERSION } from "@/lib/app-version";

type UpdateListener = (registration: ServiceWorkerRegistration) => void;

const updateListeners = new Set<UpdateListener>();
let cachedRegistration: ServiceWorkerRegistration | null = null;
let reloadInFlight = false;

function isPreviewOrIframe(): boolean {
  let inIframe = false;
  try { inIframe = window.self !== window.top; } catch { inIframe = true; }
  const host = window.location.hostname;
  const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com") || host === "localhost";
  return inIframe || isPreview;
}

export function onUpdateAvailable(listener: UpdateListener): () => void {
  updateListeners.add(listener);
  if (cachedRegistration?.waiting) listener(cachedRegistration);
  return () => updateListeners.delete(listener);
}

function notifyWaiting(reg: ServiceWorkerRegistration) {
  cachedRegistration = reg;
  updateListeners.forEach((cb) => {
    try { cb(reg); } catch { /* noop */ }
  });
}

export function applyUpdate(reg?: ServiceWorkerRegistration | null) {
  const target = reg || cachedRegistration;
  if (target?.waiting) {
    target.waiting.postMessage({ type: "SKIP_WAITING" });
  } else {
    window.location.reload();
  }
}

async function checkRemoteVersion(reg: ServiceWorkerRegistration) {
  try {
    const res = await fetch("/version.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.version && data.version !== APP_VERSION) {
      reg.update().catch(() => {});
    }
  } catch { /* offline — ignorar */ }
}

export function registerServiceWorker() {
  console.info(`[Agenda Fleur] v${APP_VERSION}`);

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (isPreviewOrIframe()) {
    // Editor / preview / dev — limpar qualquer SW antigo
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    return;
  }

  navigator.serviceWorker.register("/service-worker.js").then((reg) => {
    cachedRegistration = reg;

    if (reg.waiting && navigator.serviceWorker.controller) {
      notifyWaiting(reg);
    }

    reg.addEventListener("updatefound", () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          notifyWaiting(reg);
        }
      });
    });

    // Polling da versão
    const poll = () => checkRemoteVersion(reg);
    poll();
    setInterval(poll, 5 * 60 * 1000);
    window.addEventListener("focus", poll);
    window.addEventListener("online", poll);
  }).catch((err) => {
    console.warn("[SW] Falha ao registrar service worker:", err);
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadInFlight) return;
    reloadInFlight = true;
    window.location.reload();
  });
}
