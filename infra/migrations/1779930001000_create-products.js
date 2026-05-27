exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("products", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(255)", notNull: true },
    price: { type: "DECIMAL(10,2)", notNull: true },
    category: { type: "varchar(20)", notNull: true },
    active: { type: "boolean", notNull: true, default: true },
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
    "products",
    "products_category_check",
    "CHECK (category IN ('lanche', 'bebida', 'vitamina', 'refeicao', 'sobremesa'))",
  );
};

exports.down = false;
