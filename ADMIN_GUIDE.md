# Admin 계정 가이드

이 문서는 OnePiece 프로젝트에서 Admin 계정을 생성하고 사용하는 방법을 안내합니다.

## 📋 Admin 계정 정보

**현재 상태**: 프로젝트에는 기본 Admin 계정이 없습니다. 수동으로 생성해야 합니다.

**Admin 역할**:
- Phase 생성, 승인, 삭제
- 사용자 관리 (조회, 역할 변경)
- 제출 기록 조회
- 힌트 생성 및 관리
- Admin 대시보드 접근

---

## 🔧 Admin 계정 생성 방법

### 방법 1: 스크립트를 사용한 생성 (권장)

프로젝트에 Admin 계정 생성 스크립트가 포함되어 있습니다.

```bash
# backend 디렉토리로 이동
cd backend

# Admin 계정 생성
npx ts-node src/utils/createAdmin.ts <email> <password> <nickname>
```

**예시**:
```bash
npx ts-node src/utils/createAdmin.ts admin@example.com Admin1234 Admin
```

**또는 package.json 스크립트 사용**:
```bash
npm run create-admin <email> <password> <nickname>
```

---

### 방법 2: 기존 사용자를 Admin으로 변경

이미 일반 사용자 계정이 있고 Admin 권한이 있는 경우:

#### 2-1. Admin API를 사용 (Admin 권한 필요)

```bash
# Admin으로 로그인하여 토큰 획득
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin1234"}'

# 사용자 역할 변경
curl -X PATCH http://localhost:3001/api/admin/users/<userId>/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

#### 2-2. 데이터베이스 직접 수정

SQLite를 사용하는 경우:
```bash
# SQLite 데이터베이스 열기
sqlite3 backend/dev.db

# 사용자 역할 변경
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

# 확인
SELECT email, nickname, role FROM users WHERE email = 'user@example.com';
```

---

### 방법 3: 코드로 직접 생성

Node.js 스크립트를 작성하여 생성:

```typescript
import { AppDataSource } from './config/database';
import { User, UserRole } from './models/User';
import { UserAuthProvider, ProviderType } from './models/UserAuthProvider';
import bcrypt from 'bcrypt';

async function createAdmin() {
  await AppDataSource.initialize();
  
  const userRepository = AppDataSource.getRepository(User);
  const authProviderRepository = AppDataSource.getRepository(UserAuthProvider);
  
  const passwordHash = await bcrypt.hash('Admin1234', 12);
  
  const adminUser = userRepository.create({
    email: 'admin@example.com',
    nickname: 'Admin',
    passwordHash,
    role: UserRole.ADMIN,
  });
  
  await userRepository.save(adminUser);
  
  const authProvider = authProviderRepository.create({
    userId: adminUser.id,
    providerType: ProviderType.EMAIL_PASSWORD,
    providerId: adminUser.id,
    providerEmail: adminUser.email,
  });
  
  await authProviderRepository.save(authProvider);
  
  console.log('Admin 계정 생성 완료!');
  await AppDataSource.destroy();
}

createAdmin();
```

---

## 🔐 테스트용 Admin 계정 정보

테스트 파일에서 사용하는 Admin 계정 정보:

- **이메일**: `admin@example.com`
- **비밀번호**: `Admin1234`
- **닉네임**: `Admin`
- **역할**: `admin`

**⚠️ 주의**: 이 계정은 테스트용이며, 프로덕션 환경에서는 사용하지 마세요!

---

## 📝 Admin 계정 생성 요구사항

### 이메일
- 유효한 이메일 형식이어야 함
- 중복되지 않아야 함

### 비밀번호
- 최소 8자 이상
- 영문과 숫자를 포함해야 함
- 예시: `Admin1234`, `MyPass123`, `Secure2024`

### 닉네임
- 필수 입력
- 중복 가능

---

## 🎯 Admin 기능 사용하기

### 1. Admin으로 로그인

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin1234"
  }'
```

응답에서 `token`을 받아서 사용합니다.

### 2. Admin API 사용 예시

#### Admin 대시보드 조회
```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### Phase 생성
```bash
curl -X POST http://localhost:3001/api/admin/phases/generate-random \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 사용자 목록 조회
```bash
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### 사용자 역할 변경
```bash
curl -X PATCH http://localhost:3001/api/admin/users/<userId>/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

---

## 🔒 보안 권장사항

1. **강력한 비밀번호 사용**: 최소 12자 이상, 영문+숫자+특수문자 조합
2. **비밀번호 변경**: 정기적으로 비밀번호 변경
3. **토큰 보안**: Admin 토큰을 안전하게 보관
4. **프로덕션 환경**: 기본 비밀번호 사용 금지
5. **최소 권한 원칙**: 필요한 최소한의 Admin 계정만 유지

---

## 🐛 문제 해결

### Admin 계정이 생성되지 않는 경우

1. **데이터베이스 연결 확인**:
   ```bash
   cd backend
   npm run migrate
   ```

2. **이메일 중복 확인**:
   - 이미 존재하는 이메일인지 확인
   - 다른 이메일로 시도

3. **비밀번호 형식 확인**:
   - 최소 8자, 영문+숫자 포함

### Admin 권한이 작동하지 않는 경우

1. **토큰 확인**: 올바른 Admin 토큰을 사용하고 있는지 확인
2. **역할 확인**: 사용자의 `role` 필드가 `admin`인지 확인
3. **미들웨어 확인**: `requireAdmin` 미들웨어가 올바르게 작동하는지 확인

---

## 📚 관련 문서

- **README.md**: 프로젝트 개요
- **SETUP_GUIDE.md**: 프로젝트 설정 가이드
- **PROGRESS_SUMMARY.md**: 프로젝트 진행 상황

---

**마지막 업데이트**: 2025-12-24

