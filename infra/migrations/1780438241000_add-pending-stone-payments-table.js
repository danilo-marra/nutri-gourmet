exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("pending_stone_payments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    stone_payment_id: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },
    amount: {
      type: "decimal(10,2)",
      notNull: true,
    },
    payer_name: { type: "varchar(255)" },
    payer_email: { type: "varchar(255)" },
    payment_method: { type: "varchar(50)" },
    raw_payload: {
      type: "jsonb",
      notNull: true,
    },
    matched_at: { type: "timestamptz" },
    matched_by_id: {
      type: "uuid",
      references: "users",
      onDelete: "SET NULL",
    },
    credit_transaction_id: {
      type: "uuid",
      references: "credit_transactions",
      onDelete: "SET NULL",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("pending_stone_payments", "stone_payment_id");
  pgm.createIndex("pending_stone_payments", "matched_at", {
    where: "matched_at IS NULL",
  });
};

exports.down = (pgm) => {
  pgm.dropTable("pending_stone_payments");
};
