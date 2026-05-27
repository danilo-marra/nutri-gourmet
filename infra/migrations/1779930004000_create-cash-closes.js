exports.up = (pgm) => {
  pgm.createTable("cash_closes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    operator_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
    },
    closed_by_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
    },
    date: {
      type: "date",
      notNull: true,
    },
    total_sales: {
      type: "decimal(10,2)",
      notNull: true,
      default: 0,
    },
    total_credit: {
      type: "decimal(10,2)",
      notNull: true,
      default: 0,
    },
    total_cash: {
      type: "decimal(10,2)",
      notNull: true,
      default: 0,
    },
    total_card: {
      type: "decimal(10,2)",
      notNull: true,
      default: 0,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("cash_closes", "cash_closes_operator_date_unique", {
    unique: ["operator_id", "date"],
  });
};

exports.down = (pgm) => {
  pgm.dropTable("cash_closes");
};
