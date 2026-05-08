import { serviceClient } from "../asaas.ts";
import type { FinanceProvider } from "./types.ts";
import { createInterProvider } from "./inter-provider.ts";

export async function getProviderForCreche(crecheId: string): Promise<FinanceProvider | null> {
  const svc = serviceClient();
  const { data: c } = await svc
    .from("creches")
    .select("financial_provider")
    .eq("id", crecheId)
    .maybeSingle();
  if (!c?.financial_provider) return null;
  if (c.financial_provider === "inter") return await createInterProvider(crecheId);
  // Asaas adapter intentionally omitted — existing asaas-* functions remain canonical for now.
  return null;
}
