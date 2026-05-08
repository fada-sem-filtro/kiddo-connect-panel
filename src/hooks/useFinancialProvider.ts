import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FinancialProvider = "asaas" | "inter" | null;

export function useFinancialProvider(crecheId: string | null) {
  const [provider, setProvider] = useState<FinancialProvider>(null);
  const [environment, setEnvironment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!crecheId) { setProvider(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("creches")
      .select("financial_provider, financial_environment")
      .eq("id", crecheId)
      .maybeSingle();
    setProvider((data?.financial_provider as FinancialProvider) ?? null);
    setEnvironment((data as any)?.financial_environment ?? null);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [crecheId]);

  return { provider, environment, loading, reload };
}
