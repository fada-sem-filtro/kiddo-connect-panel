// Finance Provider abstraction — used by edge functions to support
// multiple gateways (Banco Inter PJ, Asaas, future providers) behind a
// single, stable API. Each implementation maps these methods to the
// gateway-specific REST calls.

export type ProviderName = "inter" | "asaas";
export type ChargeType = "BOLETO" | "PIX" | "BOLPIX" | "PIX_COBV";

export interface PayerInfo {
  cpf_cnpj: string;
  nome: string;
  email?: string;
  ddd?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface CreateChargeInput {
  crecheId: string;
  criancaId?: string | null;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  payer: PayerInfo;
  type?: ChargeType;
  fees?: { multa?: number; juros?: number; desconto?: number };
}

export interface ChargeResult {
  externalId: string;
  status: string;
  pixCopyPaste?: string | null;
  pixQrcodeImage?: string | null;
  pixTxid?: string | null;
  boletoLinhaDigitavel?: string | null;
  boletoPdfUrl?: string | null;
  raw: any;
}

export interface BalanceResult {
  available: number;
  blocked?: number;
  total?: number;
  raw: any;
}

export interface StatementEntry {
  date: string;
  description: string;
  amount: number;
  type: "C" | "D";
  raw: any;
}

export interface FinanceProvider {
  name: ProviderName;
  authenticate(): Promise<boolean>;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  getCharge(externalId: string): Promise<ChargeResult | null>;
  cancelCharge(externalId: string, reason?: string): Promise<boolean>;
  // Optional capabilities
  getPdf?(externalId: string): Promise<Uint8Array | null>;
  updateDueDate?(externalId: string, newDate: string): Promise<boolean>;
  getBalance?(): Promise<BalanceResult>;
  getStatement?(from: string, to: string): Promise<StatementEntry[]>;
  registerWebhook?(url: string): Promise<boolean>;
}
