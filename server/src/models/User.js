const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // 定义用户与项目的关联关系
      User.hasMany(models.Project, {
        foreignKey: 'created_by',
        as: 'createdProjects'
      });
      
      User.belongsToMany(models.Project, {
        through: 'ProjectMember',
        foreignKey: 'user_id',
        as: 'projects'
      });
    }

    // 验证密码
    async validatePassword(password) {
      return bcrypt.compare(password, this.password_hash);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true, // 软删除
    timestamps: true, // 启用 created_at 和 updated_at
    underscored: true, // 使用下划线命名约定
    hooks: {
      // 保存前对密码进行哈希处理
      beforeSave: async (user) => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
  });

  return User;
}; 