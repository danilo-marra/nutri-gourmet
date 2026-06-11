exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("login_attempts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    ip: {
      type: "varchar(45)",
      notNull: true,
    },
    attempted_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.createIndex("login_attempts", ["ip", "attempted_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("login_attempts");
};
