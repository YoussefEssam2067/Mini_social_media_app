module.exports = (db, type) => {
  return db.define("Comments", {
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
    postId: {
      type: type.INTEGER,
      references: {
        model: "Posts",
        key: "id",
      },
    },
  });
};
