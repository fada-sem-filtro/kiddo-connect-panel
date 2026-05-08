import { MoreHorizontal, Eye, Edit, Users, Wallet, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface Props {
  crecheId: string;
  onView?: () => void;
  onEdit: () => void;
  onMembros: () => void;
  onSettings?: () => void;
  onDelete: () => void;
}

export function SchoolActionsDropdown({ crecheId, onView, onEdit, onMembros, onSettings, onDelete }: Props) {
  const navigate = useNavigate();
  const goFinanceiro = () => navigate(`/admin/creches/${crecheId}/financeiro`);

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={goFinanceiro}
            className="text-primary hover:bg-primary/10 hover:text-primary rounded-lg"
            aria-label="Financeiro"
          >
            <Wallet className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Financeiro</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Mais ações">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl w-48">
          {onView && (
            <DropdownMenuItem onClick={onView} className="rounded-lg">
              <Eye className="w-4 h-4 mr-2" /> Visualizar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit} className="rounded-lg">
            <Edit className="w-4 h-4 mr-2" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMembros} className="rounded-lg">
            <Users className="w-4 h-4 mr-2" /> Usuários
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={goFinanceiro}
            className="rounded-lg text-primary focus:bg-primary/10 focus:text-primary"
          >
            <Wallet className="w-4 h-4 mr-2" /> Financeiro
          </DropdownMenuItem>
          {onSettings && (
            <DropdownMenuItem onClick={onSettings} className="rounded-lg">
              <Settings className="w-4 h-4 mr-2" /> Configurações
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
