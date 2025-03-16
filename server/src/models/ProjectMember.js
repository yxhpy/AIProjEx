const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectMember extends Model {
    static associate(models) {
      // 关联已在 User 和 Project 模型中定义
    }
  }

  ProjectMember.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member', 'viewer'),
      defaultValue: 'member',
      allowNull: false,
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'ProjectMember',
    tableName: 'project_members',
    timestamps: true, // 启用 created_at 和 updated_at
    underscored: true, // 使用下划线命名约定
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'user_id']
      }
    ]
  });

  return ProjectMember;
}; 