exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("credit_transactions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    student_id: {
      type: "uuid",
      notNull: true,
      references: '"students"',
      onDelete: "RESTRICT",
    },
    operator_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "RESTRICT",
    },
    amount: { type: "DECIMAL(10,2)", notNull: true },
    type: { type: "varchar(20)", notNull: true },
    balance_after: { type: "DECIMAL(10,2)", notNull: true },
    expires_at: { type: "timestamptz", notNull: false },
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
    "credit_transactions",
    "credit_transactions_type_check",
    "CHECK (type IN ('manual', 'package'))",
  );

  pgm.addConstraint(
    "credit_transactions",
    "credit_transactions_amount_positive",
    "CHECK (amount > 0)",
  );
};

exports.down = false;
