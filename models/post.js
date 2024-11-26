module.exports = (db, type) => {
  return db.define("Posts", {
    title: { type: type.STRING, allowNull: false },
    content: { type: type.TEXT, allowNull: false },
    images: {
      type: type.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("images");
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue("images", JSON.stringify(value));
      },
    },
    userId: {
      type: type.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
    },
  });
};
