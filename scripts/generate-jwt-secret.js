/**
 * JWT Secret 생성 스크립트
 * 
 * 사용법:
 *   node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// 32바이트(256비트) 랜덤 문자열 생성
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('='.repeat(60));
console.log('🔐 JWT_SECRET 생성 완료');
console.log('='.repeat(60));
console.log('\n다음 값을 복사하여 사용하세요:\n');
console.log(jwtSecret);
console.log('\n' + '='.repeat(60));
console.log('⚠️  이 값을 안전하게 보관하세요!');
console.log('='.repeat(60));

