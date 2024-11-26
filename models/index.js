const Sequelize = require("sequelize");
const db = require("../config/database");
const UserModel = require("./user");
const ProfileModel = require("./profile");
const PostModel = require("./post");
const CommentModel = require("./comment");

const User = UserModel(db, Sequelize);
const Profile = ProfileModel(db, Sequelize);
const Post = PostModel(db, Sequelize);
const Comment = CommentModel(db, Sequelize);

User.hasMany(Post, { foreignKey: "userId" });
Post.belongsTo(User, { foreignKey: "userId" });

Post.hasMany(Comment, { foreignKey: "postId" });
Comment.belongsTo(Post, { foreignKey: "postId" });

User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId" });

User.hasOne(Profile, { foreignKey: "userId" });
Profile.belongsTo(User, { foreignKey: "userId" });

db.sync({ force: false }).then(() => {
  console.log("Tables Created!");
});

module.exports = {
  User,
  Profile,
  Post,
  Comment,
};
