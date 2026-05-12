import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, renderTemplate, WhatsAppPlaceholders } from "@/lib/financial-whatsapp";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  phone?: string;
  template: string;
  placeholders: WhatsAppPlaceholders;
  invoiceId?: string;
  crecheId?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary" | "ghost";
  label?: string;
}

export function WhatsAppFinanceiroButton({ phone, template, placeholders, invoiceId, crecheId, size = "sm", variant = "outline", label = "WhatsApp" }: Props) {
  const onClick = async () => {
    const msg = renderTemplate(template, placeholders);
    const url = buildWhatsAppLink(phone, msg);
    // Log envio manual (best-effort)
    if (crecheId) {
      try {
        await supabase.from("financial_collection_logs" as any).insert({
          creche_id: crecheId,
          invoice_id: invoiceId || null,
          channel: "whatsapp_manual",
          status: "opened",
          recipient: phone || null,
          payload: { message: msg } as any,
        });
      } catch {}
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <Button size={size} variant={variant} onClick={onClick} className="rounded-lg gap-1.5">
      <MessageCircle className="w-4 h-4" /> {label}
    </Button>
  );
}
