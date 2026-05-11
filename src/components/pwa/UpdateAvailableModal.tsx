import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { onUpdateAvailable, applyUpdate } from "@/lib/pwa/registerSW";
import { APP_VERSION } from "@/lib/app-version";

export function UpdateAvailableModal() {
  const [open, setOpen] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    return onUpdateAvailable((registration) => {
      setReg(registration);
      setOpen(true);
    });
  }, []);

  const handleUpdate = () => {
    setUpdating(true);
    applyUpdate(reg);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !updating && setOpen(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Nova versão disponível</DialogTitle>
          <DialogDescription className="text-center">
            Uma nova versão do sistema foi instalada para melhorar estabilidade,
            segurança e desempenho. Atualize agora para continuar com a melhor experiência.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={updating}>
            Mais tarde
          </Button>
          <Button onClick={handleUpdate} disabled={updating}>
            {updating ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Atualizando…</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" /> Atualizar agora</>
            )}
          </Button>
        </DialogFooter>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Versão atual: v{APP_VERSION}
        </p>
      </DialogContent>
    </Dialog>
  );
}
