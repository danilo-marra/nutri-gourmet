import { InternalServerError } from "infra/errors.js";

const OPERADOR_FEATURES = [
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

const SUPERVISOR_FEATURES = [
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
  // Relatórios operacionais
  "read:report:operational",
  // Visibilidade de outros usuários
  "read:user",
];

const ADMIN_FEATURES = [
  ...SUPERVISOR_FEATURES,
  // Gestão de usuários
  "create:user",
  "update:user:others",
  // Relatórios financeiros
  "read:report:financial",
  // Sistema
  "read:status:all",
  "read:migration",
  "create:migration",
];

const ROLE_FEATURES = {
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

  // Relatórios
  "read:report:operational",
  "read:report:financial",
];

function getEffectiveFeatures(user) {
  const roleFeatures = ROLE_FEATURES[user?.role] ?? [];
  const manualFeatures = user?.features ?? [];
  return [...new Set([...roleFeatures, ...manualFeatures])];
}

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);

  const effectiveFeatures = getEffectiveFeatures(user);
  let authorized = effectiveFeatures.includes(feature);

  if (feature === "update:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  validateResource(resource);

  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      role: resource.role,
      features: getEffectiveFeatures(resource),
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:user:self") {
    if (user.id === resource.id) {
      return {
        id: resource.id,
        username: resource.username,
        email: resource.email,
        role: resource.role,
        features: getEffectiveFeatures(resource),
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      };
    }
  }

  if (feature === "read:session") {
    if (user.id === resource.user_id) {
      return {
        id: resource.id,
        token: resource.token,
        user_id: resource.user_id,
        created_at: resource.created_at,
        updated_at: resource.updated_at,
        expires_at: resource.expires_at,
      };
    }
  }

  if (feature === "read:activation_token") {
    return {
      id: resource.id,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
    };
  }

  if (feature == "read:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature == "create:migration") {
    return resource.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }

  if (feature === "read:status") {
    const output = {
      updated_at: resource.updated_at,
      dependencies: {
        database: {
          max_connections: resource.dependencies.database.max_connections,
          opened_connections: resource.dependencies.database.opened_connections,
        },
      },
    };

    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        resource.dependencies.database.version;
    }

    return output;
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer `user` no model `authorization`.",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `feature` válido no model `authorization`.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer um `resource` em `authorization.filterOutput().`",
    });
  }
}

const authorization = {
  can,
  filterOutput,
  getEffectiveFeatures,
};

export default authorization;
