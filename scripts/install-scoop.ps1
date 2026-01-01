# Scoop 설치 스크립트 (일반 사용자 권한)
# 관리자 권한으로 실행하지 마세요!

Write-Host "Scoop 설치를 시작합니다..." -ForegroundColor Green
Write-Host "주의: 관리자 권한으로 실행하지 마세요!" -ForegroundColor Yellow

# 실행 정책 설정 (현재 사용자만)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Scoop 설치
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

Write-Host "`nScoop 설치가 완료되었습니다!" -ForegroundColor Green
Write-Host "다음 명령어로 Supabase CLI를 설치하세요:" -ForegroundColor Cyan
Write-Host "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor White
Write-Host "  scoop install supabase" -ForegroundColor White

