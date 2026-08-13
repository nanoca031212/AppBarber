const ASAAS_API_URL = process.env.ASAAS_API_URL!;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (init?.body) {
    console.log(`[asaas] ${init?.method ?? "GET"} ${path} body:`, init.body);
  }
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
      ...init?.headers,
    },
  });

  const raw = await res.text();

  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (parseErr) {
    console.error(
      `[asaas] Falha ao parsear resposta de ${path} (status ${res.status}). Raw body:`,
      raw,
    );
    throw parseErr;
  }

  if (!res.ok) {
    console.error(
      `[asaas] Erro ${res.status} em ${init?.method ?? "GET"} ${path}. Corpo completo:`,
      JSON.stringify(data, null, 2),
    );
    const message =
      (data as { errors?: Array<{ description?: string }> })?.errors?.[0]
        ?.description ?? `Erro na API do Asaas (status ${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export type AsaasCheckoutItem = {
  name: string;
  description?: string;
  value: number;
  quantity: number;
};

export type CreateCheckoutInput = {
  billingTypes: Array<"PIX" | "BOLETO" | "CREDIT_CARD">;
  chargeTypes: Array<"DETACHED" | "RECURRENT">;
  items?: AsaasCheckoutItem[];
  subscription?: { cycle: string; nextDueDate: string };
  externalReference: string;
  minutesToExpire?: number;
  callback: { successUrl: string; cancelUrl: string; expiredUrl?: string };
};

export type AsaasCheckoutResponse = {
  id: string;
  link: string;
};

export function createCheckout(input: CreateCheckoutInput) {
  return asaasFetch<AsaasCheckoutResponse>("/checkouts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type AsaasCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
};

export function getCustomer(customerId: string) {
  return asaasFetch<AsaasCustomer>(`/customers/${customerId}`);
}

export type CreateSubaccountInput = {
  name: string;
  email: string;
  cpfCnpj: string;
  companyType: "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION";
  mobilePhone: string;
  incomeValue: number;
  address: string;
  addressNumber: string;
  province: string;
  postalCode: string;
  complement?: string;
  phone?: string;
  birthDate?: string;
};

export type AsaasSubaccount = {
  object: string;
  id: string;
  apiKey?: string;
  walletId: string;
  name: string;
  email: string;
  cpfCnpj: string;
  personType: "JURIDICA" | "FISICA";
  companyType: string | null;
  city: number;
  state: string;
  country: string;
  accountNumber?: {
    agency: string;
    account: string;
    accountDigit: string;
  };
};

// Subcontas Asaas só podem ser criadas para pessoa jurídica (CNPJ) —
// a API rejeita cpfCnpj de pessoa física nesse endpoint.
export function createSubaccount(input: CreateSubaccountInput) {
  return asaasFetch<AsaasSubaccount>("/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type AsaasRefundResponse = {
  id: string;
  status: string;
};

export function refundPayment(paymentId: string) {
  return asaasFetch<AsaasRefundResponse>(`/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

// ─── Clientes ──────────────────────────────────────────────────────────────

export type CreateCustomerInput = {
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
};

export type AsaasCustomerCreated = {
  id: string;
  name: string;
  email: string | null;
};

export function createAsaasCustomer(input: CreateCustomerInput) {
  return asaasFetch<AsaasCustomerCreated>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ─── Pagamentos diretos ───────────────────────────────────────────────────

export type AsaasPayment = {
  id: string;
  status: string;
};

export type CreatePixPaymentInput = {
  customer: string;
  value: number;
  dueDate: string;
  externalReference: string;
  description?: string;
};

export function createPixPayment(input: CreatePixPaymentInput) {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({ ...input, billingType: "PIX" }),
  });
}

export type PixQrCode = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export function getPixQrCode(paymentId: string) {
  return asaasFetch<PixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export type CreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type CreditCardHolderInfo = {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
};

export type CreateCreditCardPaymentInput = {
  customer: string;
  value: number;
  dueDate: string;
  externalReference: string;
  creditCard: CreditCard;
  creditCardHolderInfo: CreditCardHolderInfo;
  remoteIp: string;
  description?: string;
};

export function createCreditCardPayment(input: CreateCreditCardPaymentInput) {
  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({ ...input, billingType: "CREDIT_CARD" }),
  });
}
