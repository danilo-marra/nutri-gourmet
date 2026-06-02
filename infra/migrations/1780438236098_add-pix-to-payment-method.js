exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropConstraint("sales", "sales_payment_method_check");
  pgm.addConstraint(
    "sales",
    "sales_payment_method_check",
    "CHECK (payment_method IN ('credit', 'cash', 'card', 'pix'))",
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint("sales", "sales_payment_method_check");
  pgm.addConstraint(
    "sales",
    "sales_payment_method_check",
    "CHECK (payment_method IN ('credit', 'cash', 'card'))",
  );
};
