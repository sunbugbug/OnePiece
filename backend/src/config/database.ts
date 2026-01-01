import { DataSource } from 'typeorm';
import path from 'path';
import { User } from '../models/User';
import { UserAuthProvider } from '../models/UserAuthProvider';
import { Phase } from '../models/Phase';
import { PreparedPhase } from '../models/PreparedPhase';
import { UserSubmission } from '../models/UserSubmission';
import { History } from '../models/History';
import { HintVersion } from '../models/HintVersion';

// 데이터베이스 타입 결정: DATABASE_URL이 있으면 PostgreSQL, 없으면 SQLite
const isPostgreSQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

export const AppDataSource = new DataSource(
  isPostgreSQL
    ? {
        // PostgreSQL 설정 (Supabase 배포 시)
        type: 'postgres',
        url: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
        synchronize: process.env.NODE_ENV !== 'production', // 개발 환경에서만 자동 동기화
        logging: process.env.NODE_ENV === 'development',
        entities: [User, UserAuthProvider, Phase, PreparedPhase, UserSubmission, History, HintVersion],
        migrations: [path.join(__dirname, '../migrations/**/*.ts')],
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        // SQLite 설정 (로컬 개발 시)
        type: 'sqlite',
        database: process.env.DATABASE_URL || path.join(__dirname, '../../dev.db'),
        synchronize: process.env.NODE_ENV !== 'production', // 개발 환경에서만 자동 동기화
        logging: process.env.NODE_ENV === 'development',
        entities: [User, UserAuthProvider, Phase, PreparedPhase, UserSubmission, History, HintVersion],
        migrations: [path.join(__dirname, '../migrations/**/*.ts')],
      }
);

