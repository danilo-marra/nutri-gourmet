exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex("sessions", ["user_id"]);
  pgm.createIndex("sales", ["student_id"]);
  pgm.createIndex("sales", ["operator_id"]);
  pgm.createIndex("sales", ["reversed_by"]);
  pgm.createIndex("sale_items", ["sale_id"]);
  pgm.createIndex("sale_items", ["product_id"]);
  pgm.createIndex("credit_transactions", ["student_id"]);
  pgm.createIndex("credit_transactions", ["operator_id"]);
  pgm.createIndex("cash_closes", ["closed_by_id"]);
};

exports.down = (pgm) => {
  pgm.dropIndex("sessions", ["user_id"]);
  pgm.dropIndex("sales", ["student_id"]);
  pgm.dropIndex("sales", ["operator_id"]);
  pgm.dropIndex("sales", ["reversed_by"]);
  pgm.dropIndex("sale_items", ["sale_id"]);
  pgm.dropIndex("sale_items", ["product_id"]);
  pgm.dropIndex("credit_transactions", ["student_id"]);
  pgm.dropIndex("credit_transactions", ["operator_id"]);
  pgm.dropIndex("cash_closes", ["closed_by_id"]);
};
