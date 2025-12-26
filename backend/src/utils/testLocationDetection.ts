/**
 * 위치 판별 알고리즘 테스트 스크립트
 * 
 * 사용법: ts-node src/utils/testLocationDetection.ts <lat> <lng>
 * 예시: ts-node src/utils/testLocationDetection.ts 37.5665 126.9780
 */

import 'reflect-metadata';
import axios from 'axios';
import dotenv from 'dotenv';
import { isLandLocation, checkStreetViewAvailability } from '../services/locationService';

dotenv.config();

async function testLocationDetection(lat: number, lng: number) {
  console.log('\n========================================');
  console.log(`위치 판별 테스트: (${lat}, ${lng})`);
  console.log('========================================\n');

  try {
    // 1. Geocoding API로 상세 정보 확인
    console.log('1️⃣ Geocoding API 상세 정보');
    console.log('----------------------------------------');
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
    if (GOOGLE_MAPS_API_KEY) {
      try {
        const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            latlng: `${lat},${lng}`,
            key: GOOGLE_MAPS_API_KEY,
            language: 'ko',
          },
        });

        console.log(`API 응답 상태: ${geocodeResponse.data.status}`);
        console.log(`결과 수: ${geocodeResponse.data.results?.length || 0}`);
        
        if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
          const firstResult = geocodeResponse.data.results[0];
          console.log(`주소: ${firstResult.formatted_address}`);
          console.log(`타입: ${firstResult.types?.join(', ') || '없음'}`);
          console.log(`전체 타입 목록:`);
          firstResult.types?.forEach((type: string, index: number) => {
            console.log(`  ${index + 1}. ${type}`);
          });
        }
      } catch (error: any) {
        console.error('Geocoding API 호출 실패:', error.message);
      }
    }
    console.log('');

    // 2. 육지 판별 테스트
    console.log('2️⃣ 육지 판별 테스트');
    console.log('----------------------------------------');
    const isLand = await isLandLocation(lat, lng, 1);
    console.log(`결과: ${isLand ? '✅ 육지' : '❌ 바다'}\n`);

    // 3. Street View 확인 테스트
    console.log('3️⃣ Street View 확인 테스트');
    console.log('----------------------------------------');
    const hasStreetView = await checkStreetViewAvailability(lat, lng);
    console.log(`결과: ${hasStreetView ? '✅ Street View 사용 가능' : '❌ Street View 없음'}\n`);

    // 4. 최종 판정
    console.log('4️⃣ 최종 판정');
    console.log('----------------------------------------');
    if (isLand && hasStreetView) {
      console.log('✅ Phase 생성 가능: 육지이면서 Street View가 있는 위치');
    } else if (!isLand) {
      console.log('❌ Phase 생성 불가: 바다 지역');
    } else if (!hasStreetView) {
      console.log('❌ Phase 생성 불가: Street View가 없는 위치');
    }

  } catch (error: any) {
    console.error('❌ 테스트 중 에러 발생:', error.message);
    console.error(error.stack);
  }
}


// 명령줄 인자 처리
const args = process.argv.slice(2);

if (args.length === 2) {
  const lat = parseFloat(args[0]);
  const lng = parseFloat(args[1]);
  
  if (isNaN(lat) || isNaN(lng)) {
    console.error('❌ 잘못된 좌표입니다. 숫자를 입력해주세요.');
    console.error('사용법: ts-node src/utils/testLocationDetection.ts <lat> <lng>');
    process.exit(1);
  }
  
  testLocationDetection(lat, lng).then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('테스트 실패:', error);
    process.exit(1);
  });
} else {
  // 테스트 케이스 실행
  console.log('🧪 기본 테스트 케이스 실행\n');
  
  const testCases = [
    { name: '서울 (명확한 육지)', lat: 37.5665, lng: 126.9780 },
    { name: '뉴욕 (명확한 육지 + Street View)', lat: 40.7128, lng: -74.0060 },
    { name: '태평양 중앙 (바다)', lat: 0, lng: -150 },
    { name: '중국 시골 지역 (육지이지만 Street View 없을 수 있음)', lat: 29.0859, lng: 101.4073 },
    { name: '캘리포니아 (육지 + Street View)', lat: 37.0121, lng: -119.6542 },
  ];

  async function runAllTests() {
    for (const testCase of testCases) {
      console.log(`\n📌 테스트: ${testCase.name}`);
      await testLocationDetection(testCase.lat, testCase.lng);
      await new Promise(resolve => setTimeout(resolve, 1000)); // API 호출 간격
    }
  }

  runAllTests().then(() => {
    console.log('\n✅ 모든 테스트 완료');
    process.exit(0);
  }).catch((error) => {
    console.error('테스트 실패:', error);
    process.exit(1);
  });
}

