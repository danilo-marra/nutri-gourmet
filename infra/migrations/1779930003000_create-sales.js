exports.up = (pgm) => {
  pgm.createTable("sales", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    student_id: {
      type: "uuid",
      notNull: false,
      references: '"students"',
      onDelete: "RESTRICT",
    },
    operator_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "RESTRICT",
    },
    payment_method: {
      type: "varchar(10)",
      notNull: true,
    },
    total: {
      type: "DECIMAL(10,2)",
      notNull: true,
    },
    reversed_at: {
      type: "timestamptz",
      notNull: false,
    },
    reversed_by: {
      type: "uuid",
      notNull: false,
      references: '"users"',
      onDelete: "RESTRICT",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.addConstraint(
    "sales",
    "sales_payment_method_check",
    "CHECK (payment_method IN ('credit', 'cash', 'card'))",
  );

  pgm.addConstraint("sales", "sales_total_positive", "CHECK (total > 0)");

  pgm.createTable("sale_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    sale_id: {
      type: "uuid",
      notNull: true,
      references: '"sales"',
      onDelete: "RESTRICT",
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: '"products"',
      onDelete: "RESTRICT",
    },
    qty: {
      type: "integer",
      notNull: true,
    },
    unit_price: {
      type: "DECIMAL(10,2)",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });

  pgm.addConstraint(
    "sale_items",
    "sale_items_qty_positive",
    "CHECK (qty >= 1)",
  );

  pgm.addConstraint(
    "sale_items",
    "sale_items_unit_price_positive",
    "CHECK (unit_price > 0)",
  );
};

exports.down = false;
