const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Project extends Model {
    static associate(models) {
      // 定义关联关系
      Project.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      
      Project.belongsToMany(models.User, {
        through: 'ProjectMember',
        foreignKey: 'project_id',
        as: 'members'
      });
    }
  }

  Project.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('planning', 'in_progress', 'completed', 'on_hold', 'cancelled'),
      defaultValue: 'planning',
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    paranoid: true, // 软删除
    timestamps: true, // 启用 created_at 和 updated_at
    underscored: true, // 使用下划线命名约定
  });

  return Project;
}; 