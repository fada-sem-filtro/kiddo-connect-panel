import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, X, AlertCircle } from 'lucide-react';
import { computeSeoReport, type SeoInput } from '@/lib/blog-seo';

interface Props extends SeoInput {
  className?: string;
}

export function BlogSeoPanel(props: Props) {
  const report = computeSeoReport(props);

  const scoreColor =
    report.score >= 80 ? 'text-emerald-600' :
    report.score >= 60 ? 'text-amber-600' :
    'text-red-600';

  return (
    <Card className={`p-4 space-y-4 ${props.className || ''}`}>
      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-sm">Score SEO</h3>
          <span className={`text-2xl font-bold ${scoreColor}`}>{report.score}</span>
        </div>
        <Progress value={report.score} className="mt-2 h-2" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label="Palavras" value={report.wordCount} />
        <Stat label="Densidade" value={`${report.keywordDensity}%`} />
        <Stat label="Legibilidade" value={report.readabilityScore} />
      </div>
      <p className="text-xs text-muted-foreground -mt-2 text-center">
        Legibilidade: <strong>{report.readabilityLabel}</strong>
      </p>

      <div>
        <h4 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider mb-2">Verificações</h4>
        <ul className="space-y-1.5">
          {report.checks.map(c => (
            <li key={c.id} className="flex items-start gap-2 text-xs">
              {c.ok ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              ) : c.warn ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <div className={c.ok ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</div>
                {c.hint && <div className="text-[10px] text-muted-foreground">{c.hint}</div>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-3 border-t border-border">
        <h4 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider mb-2">Pré-visualização Google</h4>
        <div className="space-y-1">
          <div className="text-[11px] text-muted-foreground truncate">https://agendafleur.app/blog/{props.slug || 'slug'}</div>
          <div className="text-blue-700 dark:text-blue-400 text-base font-medium leading-tight line-clamp-1">
            {props.metaTitle || props.titulo || 'Título do artigo'}
          </div>
          <div className="text-xs text-foreground/80 line-clamp-2">
            {props.metaDescription || props.resumo || 'Descrição que aparecerá no Google.'}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-muted/40 rounded-md py-2">
      <div className="text-base font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
