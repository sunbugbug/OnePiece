import { DataSource } from 'typeorm';
import path from 'path';
import { User } from '../models/User';
import { UserAuthProvider } from '../models/UserAuthProvider';
import { Phase } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';
import { HintVersion } from '../models/HintVersion';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_URL || path.join(__dirname, '../../dev.db'),
  synchronize: process.env.NODE_ENV !== 'production', // 개발 환경에서만 자동 동기화
  logging: process.env.NODE_ENV === 'development',
  entities: [User, UserAuthProvider, Phase, PreparedPhase, UserSubmission, History, HintVersion],
  migrations: [path.join(__dirname, '../migrations/**/*.ts')],
});

// PostgreSQL을 사용하는 경우:
// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   url: process.env.DATABASE_URL,
//   synchronize: process.env.NODE_ENV !== 'production',
//   logging: process.env.NODE_ENV === 'development',
//   entities: [path.join(__dirname, '../models/**/*.ts')],
//   migrations: [path.join(__dirname, '../migrations/**/*.ts')],
// });

