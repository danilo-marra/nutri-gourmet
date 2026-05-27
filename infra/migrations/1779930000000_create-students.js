exports.up = (pgm) => {
  pgm.createTable("students", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(255)", notNull: true },
    class: { type: "varchar(50)", notNull: true },
    is_full_time: { type: "boolean", notNull: true, default: false },
    balance: { type: "DECIMAL(10,2)", notNull: true, default: 0 },
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
};

exports.down = false;
