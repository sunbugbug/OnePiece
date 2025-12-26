import { AppDataSource } from '../config/database';

async function migrate() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // TypeORM의 synchronize 옵션이 개발 환경에서 자동으로 테이블을 생성합니다.
    // 프로덕션 환경에서는 migrations를 사용해야 합니다.
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  Production mode: Please use migrations instead of synchronize');
    } else {
      console.log('✅ Database schema synchronized');
    }

    await AppDataSource.destroy();
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();


