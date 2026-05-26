exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn("users", {
    role: {
      type: "varchar(20)",
      notNull: true,
      default: "'pending'",
    },
  });

  pgm.addConstraint(
    "users",
    "users_role_check",
    "CHECK (role IN ('pending', 'operador', 'supervisor', 'admin'))",
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint("users", "users_role_check");
  pgm.dropColumn("users", "role");
};
