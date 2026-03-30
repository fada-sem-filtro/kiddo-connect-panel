import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Eye, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CriancaModal } from "@/components/modals/CriancaModal";
import { CriancaViewModal } from "@/components/modals/CriancaViewModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface CriancaRow {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_id: string;
  turma_nome: string;
  observacoes: string | null;
  email_aluno: string | null;
  responsaveis: { id: string; nome: string; parentesco: string; email: string; telefone: string }[];
}

export default function CriancasPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCrianca, setSelectedCrianca] = useState<CriancaRow | null>(null);
  const [criancas, setCriancas] = useState<CriancaRow[]>([]);
  const [turmas, setTurmas] = useState<{ id: string; nome: string; descricao?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: turmasData }, { data: criancasData }] = await Promise.all([
      supabase.from("turmas").select("id, nome, descricao").order("nome"),
      supabase.from("criancas").select("id, nome, data_nascimento, turma_id, observacoes, email_aluno, turmas(nome)").order("nome"),
    ]);

    setTurmas((turmasData || []).map((t: any) => ({ id: t.id, nome: t.nome, descricao: t.descricao })));

    const criancaIds = (criancasData || []).map((c: any) => c.id);

    // Fetch responsaveis
    let responsaveisMap: Record<string, any[]> = {};
    if (criancaIds.length > 0) {
      const { data: respData } = await supabase
        .from("crianca_responsaveis")
        .select("id, crianca_id, parentesco, responsavel_user_id")
        .in("crianca_id", criancaIds);

      if (respData && respData.length > 0) {
        const respUserIds = [...new Set(respData.map((r) => r.responsavel_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nome, email, telefone")
          .in("user_id", respUserIds);

        const profileMap: Record<string, any> = {};
        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = p;
        });

        respData.forEach((r) => {
          if (!responsaveisMap[r.crianca_id]) responsaveisMap[r.crianca_id] = [];
          const profile = profileMap[r.responsavel_user_id];
          responsaveisMap[r.crianca_id].push({
            id: r.id,
            nome: profile?.nome || "",
            email: profile?.email || "",
            telefone: profile?.telefone || "",
            parentesco: r.parentesco,
          });
        });
      }
    }

    setCriancas(
      (criancasData || []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        data_nascimento: c.data_nascimento,
        turma_id: c.turma_id,
        turma_nome: c.turmas?.nome || "Sem turma",
        observacoes: c.observacoes,
        email_aluno: c.email_aluno,
        responsaveis: responsaveisMap[c.id] || [],
      })),
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCriancas = criancas.filter((crianca) => crianca.nome.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (crianca: CriancaRow) => {
    setSelectedCrianca(crianca);
    setIsModalOpen(true);
  };

  const handleView = (crianca: CriancaRow) => {
    setSelectedCrianca(crianca);
    setIsViewModalOpen(true);
  };

  const handleDelete = (crianca: CriancaRow) => {
    setSelectedCrianca(crianca);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCrianca) {
      const { error } = await supabase.from("criancas").delete().eq("id", selectedCrianca.id);
      if (error) {
        toast.error("Erro ao remover criança");
      } else {
        toast.success("Criança removida com sucesso!");
        fetchData();
      }
    }
    setIsDeleteDialogOpen(false);
    setSelectedCrianca(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCrianca(null);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Alunos
            </h1>
            <p className="text-muted-foreground">Gerencie o cadastro das crianças</p>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criança..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Responsáveis</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredCriancas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma criança encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCriancas.map((crianca) => (
                  <TableRow key={crianca.id} className="animate-fade-in">
                    <TableCell className="font-medium">{crianca.nome}</TableCell>
                    <TableCell>{format(new Date(crianca.data_nascimento + "T00:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{crianca.turma_nome}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {crianca.responsaveis.slice(0, 2).map((resp) => (
                          <Badge key={resp.id} variant="outline" className="text-xs">
                            {resp.nome}
                          </Badge>
                        ))}
                        {crianca.responsaveis.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{crianca.responsaveis.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(crianca)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(crianca)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(crianca)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CriancaModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editData={
          selectedCrianca
            ? {
                id: selectedCrianca.id,
                nome: selectedCrianca.nome,
                data_nascimento: selectedCrianca.data_nascimento,
                turma_id: selectedCrianca.turma_id,
                observacoes: selectedCrianca.observacoes || "",
                email_aluno: selectedCrianca.email_aluno,
                responsaveis: selectedCrianca.responsaveis,
              }
            : null
        }
        turmas={turmas}
        onSaved={fetchData}
      />

      <CriancaViewModal open={isViewModalOpen} onOpenChange={setIsViewModalOpen} crianca={selectedCrianca} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedCrianca?.nome}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
