const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Requirement extends Model {
    static associate(models) {
      // 定义关联关系
      Requirement.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });
      
      Requirement.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }

  Requirement.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'approved', 'rejected', 'implemented'),
      defaultValue: 'draft',
      allowNull: false,
    },
    acceptance_criteria: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
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
    modelName: 'Requirement',
    tableName: 'requirements',
    paranoid: true, // 软删除
    timestamps: true, // 启用 created_at 和 updated_at
    underscored: true, // 使用下划线命名约定
  });

  return Requirement;
}; 