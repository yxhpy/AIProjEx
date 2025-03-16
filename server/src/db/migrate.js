const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

const migrationsPath = path.join(__dirname, 'migrations');

async function migrate() {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功。');

    // 读取迁移文件目录
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    // 依次执行迁移文件
    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsPath, file));
      console.log(`执行迁移：${file}`);
      
      // 使用事务执行迁移
      await sequelize.transaction(async (transaction) => {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize, transaction);
      });
      
      console.log(`迁移 ${file} 执行成功`);
    }

    console.log('所有迁移执行完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败：', error);
    process.exit(1);
  }
}

migrate(); 