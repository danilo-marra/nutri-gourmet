exports.shorthands = undefined;

exports.up = (pgm) => {
  // Remove duplicate names keeping the oldest row (handles dev DBs seeded multiple times)
  pgm.sql(`
    DELETE FROM products
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) AS rn
        FROM products
      ) t
      WHERE rn > 1
    )
  `);

  pgm.addConstraint("products", "products_name_unique", "UNIQUE (name)");
};

exports.down = (pgm) => {
  pgm.dropConstraint("products", "products_name_unique");
};
