module.exports = (db, type) => {
  return db.define("Profile", {
    bio: { type: type.TEXT, allowNull: true },
    avatar: {
      type: type.STRING,
      allowNull: true,
      defaultValue: "uploads/profiles/default.png",
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
