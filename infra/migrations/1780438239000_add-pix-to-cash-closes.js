exports.up = (pgm) => {
  pgm.addColumn("cash_closes", {
    total_pix: {
      type: "decimal(10,2)",
      notNull: true,
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("cash_closes", "total_pix");
};
