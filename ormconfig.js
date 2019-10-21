const path = require('path');

module.exports = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(__dirname, 'src/db/entities/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/db/migrations/*{.ts,.js}')],
  cli: {
    migrationsDir: 'src/db/migrations',
  },
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
};
