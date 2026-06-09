import { InternalServerError } from "infra/errors.js";
import type {
  ActivationToken,
  CashClose,
  CreditTransaction,
  Migration,
  Product,
  RequestUser,
  Sale,
  Session,
  StonePayment,
  Student,
  User,
  UserRole,
} from "@/types/index";

const OPERADOR_FEATURES: readonly Feature[] = [
  // Auth / perfil
  "create:session",
  "read:session",
  "update:user",
  // Vendas (próprias)
  "create:sale",
  "read:sale:self",
  "delete:sale:self",
  // Caixa
  "create:cash_close",
  // Créditos
  "create:credit",
  "update:credit",
  "read:credit",
  // Leitura de entidades necessárias para operar
  "read:student",
  "read:product",
];

const SUPERVISOR_FEATURES: readonly Feature[] = [
  ...OPERADOR_FEATURES,
  // Vendas (todas)
  "read:sale",
  "delete:sale",
  // Alunos
  "create:student",
  "update:student",
  "delete:student",
  // Produtos
  "create:product",
  "update:product",
  "delete:product",
  // Pacotes de período integral
  "create:package",
  "read:package",
  "update:package",
  "delete:package",
  // Fechamento de caixa
  "read:cash_close",
  // Relatórios
  "read:report:operational",
  "read:report:financial",
  // Pagamentos Stone/Pagar.me pendentes
  "read:stone_payment",
  "update:stone_payment",
  // Visibilidade de outros usuários
  "read:user",
  // Gestão de contas de operador
  "create:user",
  "update:user:others",
];

const ADMIN_FEATURES: readonly Feature[] = [
  ...SUPERVISOR_FEATURES,
  // Gestão de usuários
  "create:user",
  "update:user:others",
  // Sistema
  "read:status:all",
  "read:migration",
  "create:migration",
];

const ROLE_FEATURES: Record<UserRole, readonly Feature[]> = {
  pending: [],
  operador: OPERADOR_FEATURES,
  supervisor: SUPERVISOR_FEATURES,
  admin: ADMIN_FEATURES,
};

const availableFeatures = [
  // Transient (unactivated users only — not in any role)
  "read:activation_token",

  // Auth / perfil
  "create:session",
  "read:session",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",
  "create:user",
  // Sistema
  "read:migration",
  "create:migration",
  "read:status",
  "read:status:all",

  // Vendas
  "create:sale",
  "read:sale:self",
  "read:sale",
  "delete:sale:self",
  "delete:sale",

  // Caixa
  "create:cash_close",

  // Créditos
  "create:credit",
  "update:credit",
  "read:credit",

  // Alunos
  "create:student",
  "read:student",
  "update:student",
  "delete:student",

  // Produtos
  "create:product",
  "read:product",
  "update:product",
  "delete:product",

  // Pacotes
  "create:package",
  "read:package",
  "update:package",
  "delete:package",

  // Fechamento de caixa
  "read:cash_close",

  // Relatórios
  "read:report:operational",
  "read:report:financial",

  // Pagamentos Stone/Pagar.me pendentes
  "read:stone_payment",
  "update:stone_payment",
] as const;

export type Feature = (typeof availableFeatures)[number];

interface StatusResource {
  updated_at: string;
  dependencies: {
    database: {
      version?: string;
      max_connections: number;
      opened_connections: number;
    };
  };
}

function getEffectiveFeatures(user: RequestUser): Feature[] {
  const role = (user as Partial<User>)?.role;
  const roleFeatures = (role && ROLE_FEATURES[role]) ?? [];
  const manualFeatures = user?.features ?? [];
  return [...new Set([...roleFeatures, ...manualFeatures])];
}

function can(
  user: RequestUser,
  feature: Feature,
  resource?: { id?: string; role?: UserRole | string },
): boolean {
  validateUser(user);
  validateFeature(feature);

  const effectiveFeatures = getEffectiveFeatures(user);
  let authorized = effectiveFeatures.includes(feature);

  const requestingUser = user as Partial<User>;

  if (feature === "update:user" && resource) {
    authorized = false;

    if (
      requestingUser.id === resource.id ||
      can(user, "update:user:others", resource)
    ) {
      authorized = true;
    }
  }

  if (feature === "update:user:others" && resource) {
    if (
      requestingUser.role === "supervisor" &&
      !["operador", "pending"].includes(resource.role as string)
    ) {
      authorized = false;
    }
  }

  return authorized;
}

function canAssignRole(user: RequestUser, role: UserRole | string): boolean {
  validateUser(user);

  // Atribuir os roles elevados (supervisor/admin) é privilégio exclusivo do
  // admin. Qualquer outro usuário autorizado a gerir contas fica limitado a
  // operador|pending — vale para supervisores e para quem recebeu
  // `update:user:others`/`create:user` por feature manual, fechando o caminho
  // de auto-promoção de não-admins.
  return (
    (user as Partial<User>).role === "admin" ||
    ["operador", "pending"].includes(role as string)
  );
}

function filterOutput(
  user: RequestUser,
  feature: Feature,
  resource: unknown,
): unknown {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  const requestingUser = user as Partial<User>;

  if (feature === "read:user") {
    const userResource = resource as User;
    return {
      id: userResource.id,
      username: userResource.username,
      role: userResource.role,
      features: getEffectiveFeatures(userResource),
      created_at: userResource.created_at,
      updated_at: userResource.updated_at,
    };
  }

  if (feature === "read:user:self") {
    const userResource = resource as User;
    if (requestingUser.id === userResource.id) {
      return {
        id: userResource.id,
        username: userResource.username,
        email: userResource.email,
        role: userResource.role,
        features: getEffectiveFeatures(userResource),
        created_at: userResource.created_at,
        updated_at: userResource.updated_at,
      };
    }
  }

  if (feature === "read:session") {
    const sessionResource = resource as Session;
    if (requestingUser.id === sessionResource.user_id) {
      return {
        id: sessionResource.id,
        token: sessionResource.token,
        user_id: sessionResource.user_id,
        created_at: sessionResource.created_at,
        updated_at: sessionResource.updated_at,
        expires_at: sessionResource.expires_at,
      };
    }
  }

  if (feature === "read:activation_token") {
    const tokenResource = resource as ActivationToken;
    return {
      id: tokenResource.id,
      user_id: tokenResource.user_id,
      created_at: tokenResource.created_at,
      updated_at: tokenResource.updated_at,
      expires_at: tokenResource.expires_at,
      used_at: tokenResource.used_at,
    };
  }

  if (feature == "read:migration") {
    return (resource as Migration[]).map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature == "create:migration") {
    return (resource as Migration[]).map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "read:student") {
    const studentResource = resource as Student;
    return {
      id: studentResource.id,
      name: studentResource.name,
      class: studentResource.class,
      is_full_time: studentResource.is_full_time,
      balance: studentResource.balance,
      created_at: studentResource.created_at,
      updated_at: studentResource.updated_at,
    };
  }

  if (feature === "read:product") {
    const productResource = resource as Product;
    return {
      id: productResource.id,
      name: productResource.name,
      price: productResource.price,
      category: productResource.category,
      active: productResource.active,
      created_at: productResource.created_at,
      updated_at: productResource.updated_at,
    };
  }

  if (feature === "read:sale" || feature === "read:sale:self") {
    const saleResource = resource as Sale;
    return {
      id: saleResource.id,
      student_id: saleResource.student_id,
      operator_id: saleResource.operator_id,
      payment_method: saleResource.payment_method,
      total: saleResource.total,
      reversed_at: saleResource.reversed_at,
      reversed_by: saleResource.reversed_by,
      created_at: saleResource.created_at,
      updated_at: saleResource.updated_at,
      items: (saleResource.items ?? []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
      })),
    };
  }

  if (feature === "read:credit") {
    const creditResource = resource as CreditTransaction;
    return {
      id: creditResource.id,
      student_id: creditResource.student_id,
      operator_id: creditResource.operator_id,
      amount: creditResource.amount,
      type: creditResource.type,
      balance_after: creditResource.balance_after,
      expires_at: creditResource.expires_at,
      stone_payment_id: creditResource.stone_payment_id,
      created_at: creditResource.created_at,
      updated_at: creditResource.updated_at,
    };
  }

  if (feature === "read:package") {
    const packageResource = resource as CreditTransaction;
    return {
      id: packageResource.id,
      student_id: packageResource.student_id,
      operator_id: packageResource.operator_id,
      amount: packageResource.amount,
      type: packageResource.type,
      balance_after: packageResource.balance_after,
      expires_at: packageResource.expires_at,
      created_at: packageResource.created_at,
      updated_at: packageResource.updated_at,
    };
  }

  if (feature === "read:cash_close") {
    const cashCloseResource = resource as CashClose;
    return {
      id: cashCloseResource.id,
      operator_id: cashCloseResource.operator_id,
      operator_username: cashCloseResource.operator_username,
      closed_by_id: cashCloseResource.closed_by_id,
      date: cashCloseResource.date,
      total_sales: cashCloseResource.total_sales,
      total_credit: cashCloseResource.total_credit,
      total_cash: cashCloseResource.total_cash,
      total_card: cashCloseResource.total_card,
      total_pix: cashCloseResource.total_pix,
      created_at: cashCloseResource.created_at,
      updated_at: cashCloseResource.updated_at,
    };
  }

  if (feature === "read:stone_payment") {
    const stonePaymentResource = resource as StonePayment;
    return {
      id: stonePaymentResource.id,
      stone_payment_id: stonePaymentResource.stone_payment_id,
      amount: stonePaymentResource.amount,
      payer_name: stonePaymentResource.payer_name,
      payer_email: stonePaymentResource.payer_email,
      payment_method: stonePaymentResource.payment_method,
      matched_at: stonePaymentResource.matched_at,
      matched_by_id: stonePaymentResource.matched_by_id,
      credit_transaction_id: stonePaymentResource.credit_transaction_id,
      created_at: stonePaymentResource.created_at,
    };
  }

  if (
    feature === "read:report:financial" ||
    feature === "read:report:operational"
  ) {
    return resource;
  }

  if (feature === "read:status") {
    const statusResource = resource as StatusResource;
    const output: StatusResource = {
      updated_at: statusResource.updated_at,
      dependencies: {
        database: {
          max_connections: statusResource.dependencies.database.max_connections,
          opened_connections:
            statusResource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        statusResource.dependencies.database.version;
    }

    return output;
  }
}

function validateUser(user: RequestUser): void {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validateFeature(feature: Feature): void {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `feature` válido no model `authorization`.",
    });
  }
}

function validateResource(resource: unknown): void {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `resource` em `authorization.filterOutput().`",
    });
  }
}

const authorization = {
  can,
  canAssignRole,
  filterOutput,
  getEffectiveFeatures,
};

export default authorization;
