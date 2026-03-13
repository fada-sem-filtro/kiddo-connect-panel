import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EVENT_TYPE_LABELS, TIPO_REFEICAO_LABELS, RESULTADO_REFEICAO_LABELS, TIPO_HIGIENE_LABELS } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, User } from "lucide-react";

const eventSchema = z.object({
  tipo: z.string().min(1, "Selecione o tipo de evento"),
  criancaId: z.string().optional(),
  turmaId: z.string().optional(),
  observacao: z.string().optional(),
  dataInicio: z.string().min(1, "Informe a data/hora de início"),
  dataFim: z.string().optional(),
  tipoRefeicao: z.string().optional(),
  resultadoRefeicao: z.string().optional(),
  tipoHigiene: z.string().optional(),
  nomeMedicamento: z.string().optional(),
  dosagem: z.string().optional(),
  horarioAdministracao: z.string().optional(),
  authorizedPersonId: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CriancaOption {
  id: string;
  nome: string;
}

interface TurmaOption {
  id: string;
  nome: string;
}

interface AuthorizedPerson {
  id: string;
  nome: string;
  parentesco: string;
  foto_url: string | null;
}

interface EventDbModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "individual" | "turma";
  preSelectedCriancaId?: string;
  preSelectedTurmaId?: string;
  criancas?: CriancaOption[];
  turmas?: TurmaOption[];
  onSaved?: () => void;
}

export function EventDbModal({
  open,
  onOpenChange,
  mode,
  preSelectedCriancaId,
  preSelectedTurmaId,
  criancas: criancasProp,
  turmas: turmasProp,
  onSaved,
}: EventDbModalProps) {
  const { user } = useAuth();
  const [criancas, setCriancas] = useState<CriancaOption[]>(criancasProp || []);
  const [turmas, setTurmas] = useState<TurmaOption[]>(turmasProp || []);
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      tipo: "",
      criancaId: preSelectedCriancaId || "",
      turmaId: preSelectedTurmaId || "",
      observacao: "",
      dataInicio: new Date().toISOString().slice(0, 16),
      dataFim: "",
      tipoRefeicao: "",
      resultadoRefeicao: "",
      tipoHigiene: "",
      nomeMedicamento: "",
      dosagem: "",
      horarioAdministracao: "",
      authorizedPersonId: "",
    },
  });

  const selectedTipo = form.watch("tipo");
  const selectedCriancaId = form.watch("criancaId");

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: "",
        criancaId: preSelectedCriancaId || "",
        turmaId: preSelectedTurmaId || "",
        observacao: "",
        dataInicio: new Date().toISOString().slice(0, 16),
        dataFim: "",
        tipoRefeicao: "",
        resultadoRefeicao: "",
        tipoHigiene: "",
        nomeMedicamento: "",
        dosagem: "",
        horarioAdministracao: "",
        authorizedPersonId: "",
      });

      if (!criancasProp) {
        supabase
          .from("criancas")
          .select("id, nome")
          .order("nome")
          .then(({ data }) => {
            if (data) setCriancas(data);
          });
      }
      if (!turmasProp) {
        supabase
          .from("turmas")
          .select("id, nome")
          .order("nome")
          .then(({ data }) => {
            if (data) setTurmas(data);
          });
      }
    }
  }, [open, preSelectedCriancaId, preSelectedTurmaId]);

  useEffect(() => {
    if (criancasProp) setCriancas(criancasProp);
  }, [criancasProp]);

  useEffect(() => {
    if (turmasProp) setTurmas(turmasProp);
  }, [turmasProp]);

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      const baseRow = {
        tipo: data.tipo,
        observacao: data.observacao || null,
        data_inicio: data.dataInicio,
        data_fim: data.dataFim || null,
        educador_user_id: user?.id || null,
        tipo_refeicao: data.tipo === "ALIMENTACAO" ? data.tipoRefeicao || null : null,
        resultado_refeicao: data.tipo === "ALIMENTACAO" ? data.resultadoRefeicao || null : null,
        tipo_higiene: data.tipo === "HIGIENE" ? data.tipoHigiene || null : null,
        nome_medicamento: data.tipo === "MEDICAMENTO" ? data.nomeMedicamento || null : null,
        dosagem: data.tipo === "MEDICAMENTO" ? data.dosagem || null : null,
        horario_administracao:
          data.tipo === "MEDICAMENTO" && data.horarioAdministracao ? data.horarioAdministracao : null,
      };

      if (mode === "turma" && data.turmaId) {
        const { data: criancasTurma } = await supabase.from("criancas").select("id").eq("turma_id", data.turmaId);

        if (!criancasTurma || criancasTurma.length === 0) {
          toast.error("Nenhum aluno na turma");
          setLoading(false);
          return;
        }

        const rows = criancasTurma.map((c) => ({
          ...baseRow,
          crianca_id: c.id,
        }));

        const { error } = await supabase.from("eventos").insert(rows);
        if (error) throw error;
        toast.success("Evento adicionado para toda a turma!");
      } else if (data.criancaId) {
        const { error } = await supabase.from("eventos").insert({
          ...baseRow,
          crianca_id: data.criancaId,
        });
        if (error) throw error;
        toast.success("Evento adicionado!");
      }

      form.reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar evento");
    }
    setLoading(false);
  };

  const eventTypes = Object.entries(EVENT_TYPE_LABELS).filter(([value]) => value !== "SAIDA");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "turma" ? "Novo Evento para Turma" : "Novo Evento"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "turma" ? (
              <FormField
                control={form.control}
                name="turmaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {turmas.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="criancaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aluno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {criancas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Alimentação fields */}
            {selectedTipo === "ALIMENTACAO" && (
              <>
                <FormField
                  control={form.control}
                  name="tipoRefeicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Refeição</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TIPO_REFEICAO_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resultadoRefeicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aceitação da Alimentação</FormLabel>

                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(RESULTADO_REFEICAO_LABELS).map(([v, l]) => (
                          <Button
                            key={v}
                            type="button"
                            variant={field.value === v ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => field.onChange(v)}
                          >
                            {v === "comeu_bem"
                              ? "😋"
                              : v === "comeu_pouco"
                                ? "😐"
                                : v === "parcial"
                                  ? "🙂"
                                  : v === "experimentou"
                                    ? "👅"
                                    : "❌"}{" "}
                            {l}
                          </Button>
                        ))}
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Time fields for events with duration */}
            {["ALIMENTAÇÃO", "SONECA", "BRINCADEIRA", "ATIVIDADE"].includes(selectedTipo) && (
              <>
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Final</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Higiene fields */}
            {selectedTipo === "HIGIENE" && (
              <>
                <FormField
                  control={form.control}
                  name="tipoHigiene"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Higiene</FormLabel>
                      <div className="flex gap-2">
                        {Object.entries(TIPO_HIGIENE_LABELS).map(([v, l]) => (
                          <Button
                            key={v}
                            type="button"
                            variant={field.value === v ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => field.onChange(v)}
                          >
                            {v === "banho" ? "🛁" : v === "xixi" ? "💧" : "💩"} {l}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hygiene time */}
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário da Higiene</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Medicamento fields */}
            {selectedTipo === "MEDICAMENTO" && (
              <>
                <FormField
                  control={form.control}
                  name="nomeMedicamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Medicamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Dipirona" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dosagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosagem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5ml" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="horarioAdministracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Administração</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o evento..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
