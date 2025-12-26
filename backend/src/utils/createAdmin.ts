/**
 * Admin 계정 생성 유틸리티
 * 
 * 사용법:
 *   ts-node src/utils/createAdmin.ts <email> <password> <nickname>
 * 
 * 예시:
 *   ts-node src/utils/createAdmin.ts admin@example.com Admin1234 Admin
 */

import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { UserAuthProvider, ProviderType } from '../models/UserAuthProvider';
import bcrypt from 'bcrypt';

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ 사용법: ts-node src/utils/createAdmin.ts <email> <password> <nickname>');
    console.error('예시: ts-node src/utils/createAdmin.ts admin@example.com Admin1234 Admin');
    process.exit(1);
  }

  const [email, password, nickname] = args;

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ 잘못된 이메일 형식입니다.');
    process.exit(1);
  }

  // 비밀번호 강도 검증 (영문과 숫자 포함, 최소 8자, 특수문자 허용)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    console.error('❌ 비밀번호는 최소 8자 이상이며 영문과 숫자를 포함해야 합니다.');
    console.error('   (특수문자는 선택사항입니다)');
    process.exit(1);
  }

  try {
    // 데이터베이스 연결
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ 데이터베이스 연결 완료');
    }

    const userRepository = AppDataSource.getRepository(User);
    const authProviderRepository = AppDataSource.getRepository(UserAuthProvider);

    // 기존 사용자 확인
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        console.log('⚠️  이미 Admin 계정이 존재합니다.');
        console.log(`   이메일: ${existingUser.email}`);
        console.log(`   닉네임: ${existingUser.nickname}`);
        console.log(`   역할: ${existingUser.role}`);
      } else {
        // 기존 사용자를 Admin으로 변경
        existingUser.role = UserRole.ADMIN;
        await userRepository.save(existingUser);
        console.log('✅ 기존 사용자를 Admin으로 변경했습니다.');
        console.log(`   이메일: ${existingUser.email}`);
        console.log(`   닉네임: ${existingUser.nickname}`);
      }
      await AppDataSource.destroy();
      process.exit(0);
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 12);

    // Admin 사용자 생성
    const adminUser = userRepository.create({
      email,
      nickname,
      passwordHash,
      role: UserRole.ADMIN,
    });

    await userRepository.save(adminUser);

    // 인증 제공자 연결
    const authProvider = authProviderRepository.create({
      userId: adminUser.id,
      providerType: ProviderType.EMAIL_PASSWORD,
      providerId: adminUser.id,
      providerEmail: adminUser.email,
    });

    await authProviderRepository.save(authProvider);

    console.log('✅ Admin 계정이 성공적으로 생성되었습니다!');
    console.log('');
    console.log('📋 계정 정보:');
    console.log(`   이메일: ${adminUser.email}`);
    console.log(`   닉네임: ${adminUser.nickname}`);
    console.log(`   역할: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log('');
    console.log('🔐 로그인 정보:');
    console.log(`   이메일: ${email}`);
    console.log(`   비밀번호: ${password}`);
    console.log('');
    console.log('⚠️  보안을 위해 비밀번호를 안전하게 보관하세요!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Admin 계정 생성 실패:', error);
    process.exit(1);
  }
}

createAdmin();

