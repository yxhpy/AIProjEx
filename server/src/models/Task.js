const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  /**
   * 任务模型
   * 任务是从需求拆分的具体开发项，一个需求可以有多个任务
   */
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
      defaultValue: 'todo',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
      allowNull: false,
    },
    estimated_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    actual_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // 任务依赖关系，存储依赖任务的ID数组
    dependencies: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  }, {
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  });

  // 定义关联关系
  Task.associate = (models) => {
    // 任务属于某个需求
    Task.belongsTo(models.Requirement, {
      foreignKey: 'requirement_id',
      as: 'requirement',
      onDelete: 'CASCADE', // 删除需求时级联删除关联的任务
    });

    // 任务属于某个项目
    Task.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
      onDelete: 'CASCADE', // 删除项目时级联删除关联的任务
    });

    // 任务有一个负责人
    Task.belongsTo(models.User, {
      foreignKey: 'assignee_id',
      as: 'assignee',
    });

    // 任务有一个创建者
    Task.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };

  return Task;
}; 