import { getCrecheInter, interFetch, type InterAccount } from "../inter.ts";
import { auditInter } from "../inter-audit.ts";
import type {
  BalanceResult, ChargeResult, CreateChargeInput, FinanceProvider, StatementEntry,
} from "./types.ts";

export async function createInterProvider(crecheId: string): Promise<FinanceProvider | null> {
  const account = await getCrecheInter(crecheId);
  if (!account) return null;
  return new InterProviderImpl(account);
}

class InterProviderImpl implements FinanceProvider {
  name = "inter" as const;
  constructor(private account: InterAccount) {}

  async authenticate(): Promise<boolean> {
    try {
      // interFetch triggers token issuance; use a cheap call (saldo) to verify auth.
      const r = await interFetch(this.account, "/banking/v2/saldo", { method: "GET" });
      await auditInter(this.account.creche_id, "authenticate", r.ok ? "ok" : "error", { http_status: r.status, error: r.ok ? null : r.text });
      return r.ok;
    } catch (e) {
      await auditInter(this.account.creche_id, "authenticate", "error", { error: (e as Error).message });
      return false;
    }
  }

  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    const seuNumero = `AF${Date.now().toString().slice(-10)}`;
    const cpfCnpj = String(input.payer.cpf_cnpj).replace(/\D/g, "");
    const body: any = {
      seuNumero,
      valorNominal: Number(input.amount),
      dataVencimento: input.dueDate,
      numDiasAgenda: 60,
      pagador: {
        cpfCnpj,
        tipoPessoa: cpfCnpj.length > 11 ? "JURIDICA" : "FISICA",
        nome: input.payer.nome,
        email: input.payer.email || undefined,
        ddd: input.payer.ddd || undefined,
        telefone: input.payer.telefone || undefined,
        cep: (input.payer.cep || "00000000").replace(/\D/g, ""),
        endereco: input.payer.endereco || "Não informado",
        numero: input.payer.numero || "S/N",
        bairro: input.payer.bairro || "Centro",
        cidade: input.payer.cidade || "São Paulo",
        uf: input.payer.uf || "SP",
      },
      mensagem: input.description ? { linha1: input.description.slice(0, 78) } : undefined,
    };
    if (input.fees?.multa) body.multa = { codigo: "PERCENTUAL", taxa: input.fees.multa };
    if (input.fees?.juros) body.mora = { codigo: "TAXAMENSAL", taxa: input.fees.juros };
    if (input.fees?.desconto) body.desconto = { codigo: "PERCENTUALDATAINFORMADA", taxa: input.fees.desconto };

    const r = await interFetch(this.account, "/cobranca/v3/cobrancas", { method: "POST", body: JSON.stringify(body) });
    await auditInter(this.account.creche_id, "createCharge", r.ok ? "ok" : "error", {
      http_status: r.status, error: r.ok ? null : r.text, payload: { seuNumero, valor: input.amount },
    });
    if (!r.ok) throw new Error(`Inter createCharge ${r.status}: ${r.text}`);
    const codigo = r.data.codigoSolicitacao;
    const detail = await this.getCharge(codigo);
    return detail ?? { externalId: codigo, status: "EM_PROCESSAMENTO", raw: r.data };
  }

  async getCharge(externalId: string): Promise<ChargeResult | null> {
    const r = await interFetch(this.account, `/cobranca/v3/cobrancas/${externalId}`, { method: "GET" });
    if (!r.ok) return null;
    const d = r.data;
    return {
      externalId,
      status: d.cobranca?.situacao || "EM_PROCESSAMENTO",
      pixCopyPaste: d.pix?.pixCopiaECola || null,
      pixQrcodeImage: d.pix?.qrcode || null,
      pixTxid: d.pix?.txid || null,
      boletoLinhaDigitavel: d.boleto?.codigoBarras || null,
      boletoPdfUrl: null,
      raw: d,
    };
  }

  async cancelCharge(externalId: string, reason = "APEDIDODOCLIENTE"): Promise<boolean> {
    const r = await interFetch(this.account, `/cobranca/v3/cobrancas/${externalId}/cancelar`, {
      method: "POST", body: JSON.stringify({ motivoCancelamento: reason }),
    });
    await auditInter(this.account.creche_id, "cancelCharge", r.ok ? "ok" : "error", { http_status: r.status, error: r.ok ? null : r.text, payload: { externalId } });
    return r.ok;
  }

  async getPdf(externalId: string): Promise<Uint8Array | null> {
    const r = await interFetch(this.account, `/cobranca/v3/cobrancas/${externalId}/pdf`, { method: "GET" });
    if (!r.ok) return null;
    const b64 = r.data?.pdf;
    if (!b64) return null;
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  }

  async updateDueDate(externalId: string, newDate: string): Promise<boolean> {
    const r = await interFetch(this.account, `/cobranca/v3/cobrancas/${externalId}`, {
      method: "PATCH", body: JSON.stringify({ dataVencimento: newDate }),
    });
    await auditInter(this.account.creche_id, "updateDueDate", r.ok ? "ok" : "error", { http_status: r.status, error: r.ok ? null : r.text, payload: { externalId, newDate } });
    return r.ok;
  }

  async getBalance(): Promise<BalanceResult> {
    const r = await interFetch(this.account, "/banking/v2/saldo", { method: "GET" });
    if (!r.ok) throw new Error(`Inter saldo ${r.status}: ${r.text}`);
    const d = r.data;
    return {
      available: Number(d.disponivel ?? 0),
      blocked: Number(d.bloqueado?.total ?? 0),
      total: Number(d.disponivel ?? 0) + Number(d.bloqueado?.total ?? 0),
      raw: d,
    };
  }

  async getStatement(from: string, to: string): Promise<StatementEntry[]> {
    const qs = new URLSearchParams({ dataInicio: from, dataFim: to }).toString();
    const r = await interFetch(this.account, `/banking/v2/extrato?${qs}`, { method: "GET" });
    if (!r.ok) throw new Error(`Inter extrato ${r.status}: ${r.text}`);
    const list = r.data?.transacoes || [];
    return list.map((t: any) => ({
      date: t.dataEntrada || t.dataInclusao,
      description: t.descricao || t.titulo || "",
      amount: Number(t.valor ?? 0),
      type: (t.tipoOperacao === "C" || t.tipo === "C") ? "C" : "D",
      raw: t,
    }));
  }

  async registerWebhook(url: string): Promise<boolean> {
    const r = await interFetch(this.account, "/cobranca/v3/cobrancas/webhook", {
      method: "PUT", body: JSON.stringify({ webhookUrl: url }),
    });
    await auditInter(this.account.creche_id, "registerWebhook", r.ok ? "ok" : "error", { http_status: r.status, error: r.ok ? null : r.text, payload: { url } });
    return r.ok;
  }
}
