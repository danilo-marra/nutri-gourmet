exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("credit_transactions", {
    stone_payment_id: {
      type: "varchar(100)",
      notNull: false,
      unique: true,
    },
  });

  pgm.dropConstraint("credit_transactions", "credit_transactions_type_check");
  pgm.addConstraint(
    "credit_transactions",
    "credit_transactions_type_check",
    "CHECK (type IN ('manual', 'package', 'stone'))",
  );
};

exports.down = (pgm) => {
  pgm.dropColumns("credit_transactions", ["stone_payment_id"]);

  pgm.dropConstraint("credit_transactions", "credit_transactions_type_check");
  pgm.addConstraint(
    "credit_transactions",
    "credit_transactions_type_check",
    "CHECK (type IN ('manual', 'package'))",
  );
};
