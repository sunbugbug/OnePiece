import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

async function listUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 완료');

    const userRepository = AppDataSource.getRepository(User);

    // 모든 사용자 조회
    const users = await userRepository.find({
      order: { createdAt: 'ASC' },
    });

    if (users.length === 0) {
      console.log('❌ 데이터베이스에 사용자가 없습니다.');
      console.log('💡 먼저 회원가입을 진행하거나 Admin 계정을 생성하세요.');
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log(`\n📋 사용자 목록 (총 ${users.length}개):\n`);
    console.log('='.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 사용자 정보:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   이메일: ${user.email}`);
      console.log(`   닉네임: ${user.nickname}`);
      console.log(`   역할: ${user.role}`);
      console.log(`   비밀번호 해시: ${user.passwordHash ? '있음' : '없음'}`);
      console.log(`   생성일: ${user.createdAt.toLocaleString('ko-KR')}`);
      console.log(`   마지막 로그인: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString('ko-KR') : '없음'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ 총 ${users.length}개의 사용자가 있습니다.`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 사용자 조회 실패:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

listUsers();




