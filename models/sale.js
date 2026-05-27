import database from "infra/database.js";
import product from "models/product.js";
import student from "models/student.js";
import { NotFoundError, ValidationError } from "infra/errors.js";

const PAYMENT_METHODS = ["credit", "cash", "card"];

async function create(operatorId, values) {
  const { student_id, payment_method, items } = values;

  if (!payment_method || !PAYMENT_METHODS.includes(payment_method)) {
    throw new ValidationError({
      message: `O campo 'payment_method' deve ser 'credit', 'cash' ou 'card'.`,
      action: "Informe uma forma de pagamento válida.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError({
      message: "A venda deve conter ao menos um item.",
      action: "Informe os itens da venda.",
    });
  }

  for (const item of items) {
    if (!item.product_id) {
      throw new ValidationError({
        message: "Cada item deve ter um 'product_id'.",
        action: "Informe o produto de cada item da venda.",
      });
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1) {
      throw new ValidationError({
        message:
          "O campo 'qty' de cada item deve ser um inteiro maior que zero.",
        action: "Informe uma quantidade válida para cada item.",
      });
    }
  }

  const resolvedItems = await resolveItems(items);
  const total = resolvedItems.reduce(
    (sum, item) => sum + item.unit_price * item.qty,
    0,
  );

  if (payment_method === "credit") {
    const foundStudent = await student.findOneById(student_id);
    if (parseFloat(foundStudent.balance) < total) {
      throw new ValidationError({
        message: "Saldo insuficiente para realizar a venda.",
        action:
          "Verifique o saldo do aluno ou escolha outra forma de pagamento.",
      });
    }
  }

  return await runCreateTransaction({
    operatorId,
    studentId: student_id ?? null,
    paymentMethod: payment_method,
    items: resolvedItems,
    total,
  });

  async function resolveItems(rawItems) {
    const resolved = [];
    for (const item of rawItems) {
      const foundProduct = await product.findOneById(item.product_id);
      if (!foundProduct.active) {
        throw new ValidationError({
          message: `Produto '${foundProduct.name}' está inativo e não pode ser vendido.`,
          action: "Remova o produto inativo da venda ou escolha outro.",
        });
      }
      resolved.push({
        product_id: foundProduct.id,
        qty: Number(item.qty),
        unit_price: parseFloat(foundProduct.price),
      });
    }
    return resolved;
  }

  async function runCreateTransaction({
    operatorId,
    studentId,
    paymentMethod,
    items,
    total,
  }) {
    const client = await database.getNewClient();
    try {
      await client.query("BEGIN");

      if (paymentMethod === "credit") {
        const debit = await client.query({
          text: `UPDATE students SET balance = balance - $1 WHERE id = $2 AND balance >= $1`,
          values: [total, studentId],
        });
        if (debit.rowCount === 0) {
          throw new ValidationError({
            message: "Saldo insuficiente para realizar a venda.",
            action:
              "Verifique o saldo do aluno ou escolha outra forma de pagamento.",
          });
        }
      }

      const saleResult = await client.query({
        text: `
          INSERT INTO sales (student_id, operator_id, payment_method, total)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        values: [studentId, operatorId, paymentMethod, total],
      });
      const sale = saleResult.rows[0];

      const saleItems = [];
      for (const item of items) {
        const itemResult = await client.query({
          text: `
            INSERT INTO sale_items (sale_id, product_id, qty, unit_price)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `,
          values: [sale.id, item.product_id, item.qty, item.unit_price],
        });
        saleItems.push(itemResult.rows[0]);
      }

      await client.query("COMMIT");
      return { ...sale, items: saleItems };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.end();
    }
  }
}

async function findOneById(id) {
  const saleResult = await database.query({
    text: `SELECT * FROM sales WHERE id = $1`,
    values: [id],
  });

  if (saleResult.rows.length === 0) {
    throw new NotFoundError({
      message: "Venda não encontrada.",
      action: "Verifique o id informado.",
    });
  }

  const sale = saleResult.rows[0];

  const itemsResult = await database.query({
    text: `SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY created_at ASC`,
    values: [id],
  });

  return { ...sale, items: itemsResult.rows };
}

async function findAll({ operatorId } = {}) {
  const result = await database.query({
    text: `
      SELECT
        s.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', si.id,
              'product_id', si.product_id,
              'qty', si.qty,
              'unit_price', si.unit_price,
              'created_at', si.created_at,
              'updated_at', si.updated_at
            ) ORDER BY si.created_at ASC
          ) FILTER (WHERE si.id IS NOT NULL),
          '[]'
        ) AS items
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE ($1::uuid IS NULL OR s.operator_id = $1)
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `,
    values: [operatorId ?? null],
  });

  return result.rows;
}

async function reverse(saleId, reversedBy) {
  const client = await database.getNewClient();
  try {
    await client.query("BEGIN");

    const result = await client.query({
      text: `
        UPDATE sales
        SET reversed_at = timezone('utc', now()),
            reversed_by = $1
        WHERE id = $2 AND reversed_at IS NULL
        RETURNING *
      `,
      values: [reversedBy, saleId],
    });

    if (result.rows.length === 0) {
      throw new NotFoundError({
        message: "Venda não encontrada ou já estornada.",
        action: "Verifique o id informado.",
      });
    }

    const sale = result.rows[0];

    if (sale.payment_method === "credit" && sale.student_id) {
      await client.query({
        text: `UPDATE students SET balance = balance + $1 WHERE id = $2`,
        values: [sale.total, sale.student_id],
      });
    }

    await client.query("COMMIT");

    const itemsResult = await client.query({
      text: `SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY created_at ASC`,
      values: [saleId],
    });

    return { ...sale, items: itemsResult.rows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

const sale = { create, findOneById, findAll, reverse };

export default sale;
