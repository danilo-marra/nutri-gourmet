import database from "infra/database.js";
import { ValidationError, NotFoundError, ConflictError } from "infra/errors.js";
import type { Product, ProductCategory } from "@/types/index";

const VALID_CATEGORIES: readonly ProductCategory[] = [
  "lanche",
  "bebida",
  "vitamina",
  "refeicao",
  "sobremesa",
];

interface ProductInputValues {
  name?: string;
  price?: number | string | null;
  category?: string;
  active?: boolean;
}

function isValidCategory(category: unknown): category is ProductCategory {
  return (VALID_CATEGORIES as readonly unknown[]).includes(category);
}

async function create(values: ProductInputValues): Promise<Product> {
  if (!values?.name) {
    throw new ValidationError({
      message: "O campo 'name' é obrigatório.",
      action: "Informe o nome do produto.",
    });
  }

  if (values.price === undefined || values.price === null) {
    throw new ValidationError({
      message: "O campo 'price' é obrigatório.",
      action: "Informe o preço do produto.",
    });
  }

  if (!values?.category) {
    throw new ValidationError({
      message: "O campo 'category' é obrigatório.",
      action: "Informe a categoria do produto.",
    });
  }

  if (!isValidCategory(values.category)) {
    throw new ValidationError({
      message: `A categoria '${values.category}' é inválida.`,
      action: `Utilize uma das categorias válidas: ${VALID_CATEGORIES.join(", ")}.`,
    });
  }

  try {
    const newProduct = await runInsertQuery(values);
    return newProduct;
  } catch (err: unknown) {
    const pgCode = (err as { cause?: { code?: string } }).cause?.code;
    if (pgCode === "23505") {
      throw new ConflictError({
        message: "Já existe um produto com este nome.",
        action: "Escolha um nome diferente para o produto.",
      });
    }
    throw err;
  }

  async function runInsertQuery(values: ProductInputValues): Promise<Product> {
    const active = values.active !== undefined ? values.active : true;

    const results = await database.query<Product>({
      text: `
      INSERT INTO
        products (name, price, category, active)
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        *
      ;`,
      values: [values.name, values.price, values.category, active],
    });

    return results.rows[0];
  }
}

async function findAll({ activeOnly = false } = {}): Promise<Product[]> {
  const products = await runSelectQuery(activeOnly);
  return products;

  async function runSelectQuery(activeOnly: boolean): Promise<Product[]> {
    const whereClause = activeOnly ? "WHERE active = true" : "";

    const results = await database.query<Product>({
      text: `
      SELECT
        *
      FROM
        products
      ${whereClause}
      ORDER BY
        name ASC
      ;`,
    });

    return results.rows;
  }
}

async function findOneById(id: string): Promise<Product> {
  const productFound = await runSelectQuery(id);
  return productFound;

  async function runSelectQuery(id: string): Promise<Product> {
    const results = await database.query<Product>({
      text: `
      SELECT
        *
      FROM
        products
      WHERE
        id = $1
      LIMIT
        1
      ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Produto não encontrado.",
        action: "Verifique se o ID do produto está correto.",
      });
    }

    return results.rows[0];
  }
}

async function update(
  id: string,
  values: ProductInputValues,
): Promise<Product> {
  const currentProduct = await findOneById(id);

  if ("name" in values && !values.name) {
    throw new ValidationError({
      message: "O campo 'name' não pode ser vazio.",
      action: "Informe um nome válido para o produto.",
    });
  }

  if (
    "price" in values &&
    (values.price === null || values.price === undefined)
  ) {
    throw new ValidationError({
      message: "O campo 'price' não pode ser nulo.",
      action: "Informe um preço válido para o produto.",
    });
  }

  if ("category" in values && !isValidCategory(values.category)) {
    throw new ValidationError({
      message: `A categoria '${values.category}' é inválida.`,
      action: `Utilize uma das categorias válidas: ${VALID_CATEGORIES.join(", ")}.`,
    });
  }

  const productWithNewValues = {
    ...currentProduct,
    ...values,
  } as Product;

  try {
    const updatedProduct = await runUpdateQuery(productWithNewValues);
    return updatedProduct;
  } catch (err: unknown) {
    const pgCode = (err as { cause?: { code?: string } }).cause?.code;
    if (pgCode === "23505") {
      throw new ConflictError({
        message: "Já existe um produto com este nome.",
        action: "Escolha um nome diferente para o produto.",
      });
    }
    throw err;
  }

  async function runUpdateQuery(productWithNewValues: Product) {
    const results = await database.query<Product>({
      text: `
      UPDATE
        products
      SET
        name = $2,
        price = $3,
        category = $4,
        active = $5,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [
        productWithNewValues.id,
        productWithNewValues.name,
        productWithNewValues.price,
        productWithNewValues.category,
        productWithNewValues.active,
      ],
    });

    return results.rows[0];
  }
}

async function deactivate(id: string): Promise<Product> {
  await findOneById(id);

  const deactivatedProduct = await runUpdateQuery(id);
  return deactivatedProduct;

  async function runUpdateQuery(id: string): Promise<Product> {
    const results = await database.query<Product>({
      text: `
      UPDATE
        products
      SET
        active = false,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [id],
    });

    return results.rows[0];
  }
}

const product = { create, findAll, findOneById, update, deactivate };

export default product;
