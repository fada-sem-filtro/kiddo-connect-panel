import { serviceClient } from "./asaas.ts";

export async function auditInter(
  crecheId: string,
  action: string,
  status: "ok" | "error" | "warn",
  extra: { http_status?: number | null; error?: string | null; payload?: any; request_id?: string | null } = {},
): Promise<void> {
  try {
    const svc = serviceClient();
    await svc.from("inter_audit_logs").insert({
      creche_id: crecheId,
      action,
      status,
      http_status: extra.http_status ?? null,
      error: extra.error ?? null,
      request_id: extra.request_id ?? null,
      payload: extra.payload ?? null,
    });
  } catch (e) {
    console.error("auditInter failed", e);
  }
}
