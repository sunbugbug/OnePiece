import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';

async function listAdmins() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 완료');

    const userRepository = AppDataSource.getRepository(User);

    // Admin 역할을 가진 모든 사용자 조회
    const adminUsers = await userRepository.find({
      where: { role: UserRole.ADMIN },
      order: { createdAt: 'ASC' },
    });

    if (adminUsers.length === 0) {
      console.log('❌ Admin 계정이 없습니다.');
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log(`\n📋 Admin 계정 목록 (총 ${adminUsers.length}개):\n`);
    console.log('='.repeat(80));

    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin 계정 정보:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   이메일: ${admin.email}`);
      console.log(`   닉네임: ${admin.nickname}`);
      console.log(`   역할: ${admin.role}`);
      console.log(`   생성일: ${admin.createdAt.toLocaleString('ko-KR')}`);
      console.log(`   마지막 로그인: ${admin.lastLoginAt ? admin.lastLoginAt.toLocaleString('ko-KR') : '없음'}`);
      console.log(`   업데이트일: ${admin.updatedAt.toLocaleString('ko-KR')}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ 총 ${adminUsers.length}개의 Admin 계정이 있습니다.`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Admin 계정 조회 실패:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

listAdmins();



