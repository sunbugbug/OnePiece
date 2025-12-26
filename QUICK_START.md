# 빠른 시작 가이드

## 🎮 게임을 시작하기 전에

게임을 플레이하려면 **Active Phase**가 필요합니다. 처음 시작할 때는 Admin 계정으로 Phase를 생성하고 활성화해야 합니다.

---

## 1단계: Admin으로 로그인

1. http://localhost:3000/login 접속
2. Admin 계정으로 로그인:
   - **이메일**: `ygy0803@gmail.com`
   - **비밀번호**: `1dnjf7dlf!`

---

## 2단계: Phase 생성 및 활성화

### 방법 1: Admin API 사용 (권장)

**터미널에서 실행**:

```bash
# 1. Admin으로 로그인하여 토큰 획득
$body = @{
    email = "ygy0803@gmail.com"
    password = "1dnjf7dlf!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResponse.token

# 2. Phase 생성
$phaseBody = @{
    hintText = "이 힌트를 통해 위치를 찾아보세요!"
} | ConvertTo-Json

$phaseResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/phase/admin/create" -Method POST -Body $phaseBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}

$phaseId = $phaseResponse.phase.id
Write-Host "생성된 Phase ID: $phaseId"

# 3. Phase 승인 (Prepared Pool에 추가)
Invoke-RestMethod -Uri "http://localhost:3001/api/phase/admin/approve/$phaseId" -Method POST -Headers @{Authorization="Bearer $token"}

# 4. Phase 활성화 (Active로 변경)
$activateBody = @{
    phaseId = $phaseId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/phases/$phaseId/activate" -Method POST -Body $activateBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
```

### 방법 2: 랜덤 Phase 생성

```bash
# Admin 토큰 획득 (위와 동일)
$body = @{
    email = "ygy0803@gmail.com"
    password = "1dnjf7dlf!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResponse.token

# 랜덤 Phase 생성 (자동으로 활성화됨)
$randomBody = @{
    count = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/phases/generate-random" -Method POST -Body $randomBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
```

---

## 3단계: 게임 플레이

Phase가 활성화되면:

1. http://localhost:3000 접속 (또는 새로고침)
2. Active Phase의 힌트 확인
3. Google Maps에서 위치 선택
4. "제출하기" 버튼 클릭

---

## 🔧 문제 해결

### "No active phase found" 오류

**원인**: Active Phase가 없음

**해결**: 위의 2단계를 따라 Phase를 생성하고 활성화하세요.

### Phase 활성화 API가 없는 경우

현재 코드를 확인한 결과, Phase를 활성화하는 직접적인 API가 없을 수 있습니다. 대신:

1. Phase를 생성하고 승인한 후
2. `activateNextPhase()` 함수를 호출하거나
3. 데이터베이스에서 직접 상태를 변경할 수 있습니다:

```bash
# SQLite로 직접 활성화
sqlite3 backend/dev.db "UPDATE phases SET status = 'active' WHERE id = '<phase-id>';"
```

---

## 📝 참고

- **Phase 상태**: `prepared` → `active` → `solved`
- **Active Phase**: 한 번에 하나만 존재할 수 있음
- **Prepared Pool**: 승인된 Phase들이 대기하는 곳
- **자동 활성화**: Active Phase가 없으면 Prepared Pool에서 자동으로 가져옴

---

**마지막 업데이트**: 2025-12-24

