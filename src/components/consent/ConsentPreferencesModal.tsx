import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent/ConsentContext";
import { ConsentChoices, DEFAULT_REJECTED } from "@/lib/consent/types";

interface CategoryDef {
  key: keyof ConsentChoices;
  title: string;
  required?: boolean;
  description: string;
  examples: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "necessary",
    title: "Necessários",
    required: true,
    description: "Essenciais para o funcionamento do sistema, autenticação e segurança. Não podem ser desativados.",
    examples: "Sessão de login, CSRF, preferência de tema.",
  },
  {
    key: "functional",
    title: "Funcionais",
    required: false,
    description: "Permitem lembrar suas escolhas (idioma, layout) para uma experiência mais personalizada.",
    examples: "Preferências de menu, último filtro usado.",
  },
  {
    key: "analytics",
    title: "Analytics",
    required: false,
    description: "Coletam dados anônimos sobre o uso do site para melhorarmos performance e conteúdo.",
    examples: "Google Analytics 4, Microsoft Clarity.",
  },
  {
    key: "marketing",
    title: "Marketing",
    required: false,
    description: "Permitem mensurar campanhas e exibir conteúdo mais relevante para você.",
    examples: "Meta Pixel, Google Ads.",
  },
  {
    key: "personalization",
    title: "Personalização",
    required: false,
    description: "Adaptam recomendações e conteúdos com base em seu comportamento de navegação.",
    examples: "Hotjar, recomendadores de conteúdo.",
  },
];

export function ConsentPreferencesModal() {
  const { preferencesOpen, closePreferences, consent, setChoices, acceptAll, rejectOptional } = useConsent();
  const [draft, setDraft] = useState<ConsentChoices>(consent?.choices ?? DEFAULT_REJECTED);

  useEffect(() => {
    if (preferencesOpen) setDraft(consent?.choices ?? DEFAULT_REJECTED);
  }, [preferencesOpen, consent]);

  const update = (key: keyof ConsentChoices, value: boolean) => {
    if (key === "necessary") return;
    setDraft((d) => ({ ...d, [key]: value, necessary: true }));
  };

  return (
    <Dialog open={preferencesOpen} onOpenChange={(v) => !v && closePreferences()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preferências de Privacidade</DialogTitle>
          <DialogDescription>
            Escolha quais categorias de cookies podem ser usadas. Você pode alterar essas
            preferências a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{cat.title}</h4>
                    {cat.required && (
                      <span className="text-[10px] uppercase tracking-wide bg-muted px-2 py-0.5 rounded">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-1">
                    <span className="font-medium">Exemplos:</span> {cat.examples}
                  </p>
                </div>
                <Switch
                  checked={cat.required ? true : !!draft[cat.key]}
                  disabled={cat.required}
                  onCheckedChange={(v) => update(cat.key, v)}
                  aria-label={`Ativar ${cat.title}`}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={rejectOptional}>Recusar opcionais</Button>
          <Button variant="outline" size="sm" onClick={acceptAll}>Aceitar todos</Button>
          <Button size="sm" onClick={() => setChoices(draft)}>Salvar preferências</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
