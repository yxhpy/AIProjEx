const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/db.config');

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    pool: config.pool,
    logging: config.logging,
    timezone: config.timezone
  }
);

const db = {};

// 加载所有模型
fs.readdirSync(__dirname)
  .filter(file => 
    file.indexOf('.') !== 0 && 
    file !== path.basename(__filename) && 
    file.slice(-3) === '.js'
  )
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// 建立模型之间的关联关系
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; 