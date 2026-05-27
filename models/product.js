import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

const VALID_CATEGORIES = [
  "lanche",
  "bebida",
  "vitamina",
  "refeicao",
  "sobremesa",
];

async function create(values) {
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

  if (!VALID_CATEGORIES.includes(values.category)) {
    throw new ValidationError({
      message: `A categoria '${values.category}' é inválida.`,
      action: `Utilize uma das categorias válidas: ${VALID_CATEGORIES.join(", ")}.`,
    });
  }

  const newProduct = await runInsertQuery(values);
  return newProduct;

  async function runInsertQuery(values) {
    const active = values.active !== undefined ? values.active : true;

    const results = await database.query({
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

async function findAll({ activeOnly = false } = {}) {
  const products = await runSelectQuery(activeOnly);
  return products;

  async function runSelectQuery(activeOnly) {
    const whereClause = activeOnly ? "WHERE active = true" : "";

    const results = await database.query({
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

async function findOneById(id) {
  const productFound = await runSelectQuery(id);
  return productFound;

  async function runSelectQuery(id) {
    const results = await database.query({
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

async function update(id, values) {
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

  if ("category" in values && !VALID_CATEGORIES.includes(values.category)) {
    throw new ValidationError({
      message: `A categoria '${values.category}' é inválida.`,
      action: `Utilize uma das categorias válidas: ${VALID_CATEGORIES.join(", ")}.`,
    });
  }

  const productWithNewValues = {
    ...currentProduct,
    ...values,
  };

  const updatedProduct = await runUpdateQuery(productWithNewValues);
  return updatedProduct;

  async function runUpdateQuery(productWithNewValues) {
    const results = await database.query({
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

async function deactivate(id) {
  await findOneById(id);

  const deactivatedProduct = await runUpdateQuery(id);
  return deactivatedProduct;

  async function runUpdateQuery(id) {
    const results = await database.query({
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
