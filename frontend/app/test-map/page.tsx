'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// 환경 표시 컴포넌트 (클라이언트 사이드에서만 실행)
function EnvironmentIndicator() {
  const [isBrowser, setIsBrowser] = useState(false);
  
  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined');
  }, []);
  
  return (
    <p className="text-sm" suppressHydrationWarning>
      {isBrowser ? '✅ 브라우저' : '로딩 중...'}
    </p>
  );
}

export default function TestMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    const testGoogleMapsAPI = async () => {
      addLog('=== Google Maps API 테스트 시작 ===');
      setStatus('loading');
      setError(null);

      // 1. 환경 변수 확인
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      addLog(`1. API 키 확인: ${apiKey ? `${apiKey.substring(0, 10)}...` : '❌ 없음'}`);
      
      if (!apiKey || apiKey === 'your-google-maps-api-key') {
        const errMsg = 'API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.';
        addLog(`❌ ${errMsg}`);
        setError(errMsg);
        setStatus('error');
        return;
      }

      // 2. mapRef 확인
      addLog('2. mapRef 확인 중...');
      let retryCount = 0;
      while (!mapRef.current && retryCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }

      if (!mapRef.current) {
        const errMsg = 'mapRef를 찾을 수 없습니다.';
        addLog(`❌ ${errMsg}`);
        setError(errMsg);
        setStatus('error');
        return;
      }
      addLog(`✅ mapRef 확인 완료 (크기: ${mapRef.current.offsetWidth}x${mapRef.current.offsetHeight})`);

      // 3. setOptions 호출
      try {
        addLog('3. setOptions 호출 중...');
        setOptions({
          apiKey: apiKey,
          version: 'weekly',
        });
        addLog('✅ setOptions 완료');
      } catch (err: any) {
        const errMsg = `setOptions 실패: ${err.message}`;
        addLog(`❌ ${errMsg}`);
        setError(errMsg);
        setStatus('error');
        return;
      }

      // 4. importLibrary 호출
      try {
        addLog('4. importLibrary("maps") 호출 중...');
        await importLibrary('maps');
        addLog('✅ importLibrary 완료');
      } catch (err: any) {
        const errMsg = `importLibrary 실패: ${err.message}`;
        addLog(`❌ ${errMsg}`);
        setError(errMsg);
        setStatus('error');
        return;
      }

      // 5. google.maps 객체 확인
      addLog('5. google.maps 객체 확인 중...');
      let retries = 0;
      const maxRetries = 20;
      
      while (retries < maxRetries) {
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps && (window as any).google.maps.Map) {
          addLog('✅ google.maps 객체 확인 완료');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }

      if (retries >= maxRetries) {
        const errMsg = 'google.maps 객체를 찾을 수 없습니다.';
        addLog(`❌ ${errMsg}`);
        setError(errMsg);
        setStatus('error');
        return;
      }

      // 6. Map 인스턴스 생성
      try {
        addLog('6. Map 인스턴스 생성 중...');
        const { Map } = (window as any).google.maps;
        
        if (!mapRef.current) {
          const errMsg = 'mapRef가 null입니다.';
          addLog(`❌ ${errMsg}`);
          setError(errMsg);
          setStatus('error');
          return;
        }

        const map = new Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.978 }, // 서울
          zoom: 10,
          mapTypeId: 'roadmap',
        });

        addLog('✅ Map 인스턴스 생성 완료');
        addLog('=== 테스트 성공! ===');
        setStatus('success');

        // 지도 클릭 이벤트 추가
        map.addListener('click', (e: any) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            addLog(`📍 지도 클릭: (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
          }
        });

      } catch (err: any) {
        const errMsg = `Map 인스턴스 생성 실패: ${err.message}`;
        addLog(`❌ ${errMsg}`);
        setError(errMsg);
        setStatus('error');
        return;
      }
    };

    // 약간의 지연 후 테스트 시작 (DOM이 완전히 준비되도록)
    const timeout = setTimeout(() => {
      testGoogleMapsAPI();
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Google Maps API 테스트</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* 지도 영역 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">지도</h2>
            <div className="relative">
              <div 
                ref={mapRef} 
                className="w-full h-[400px] sm:h-[500px] rounded-lg border-2 border-gray-300"
                style={{ minHeight: '400px' }}
              />
              {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">로딩 중...</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
                  <div className="text-center p-4">
                    <p className="text-red-600 font-semibold">❌ 오류 발생</p>
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  </div>
                </div>
              )}
              {status === 'success' && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ✅ 지도 로드 성공
                </div>
              )}
            </div>
          </div>

          {/* 로그 영역 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">테스트 로그</h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 border rounded"
              >
                로그 지우기
              </button>
            </div>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-[400px] sm:h-[500px] overflow-y-auto font-mono text-xs sm:text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">로그가 없습니다...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">상태 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">상태:</p>
              <p className={`font-semibold ${
                status === 'success' ? 'text-green-600' :
                status === 'error' ? 'text-red-600' :
                status === 'loading' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {status === 'idle' && '대기 중'}
                {status === 'loading' && '로딩 중...'}
                {status === 'success' && '✅ 성공'}
                {status === 'error' && '❌ 오류'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">API 키:</p>
              <p className="font-mono text-xs break-all">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
                  ? `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...` 
                  : '❌ 없음'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">환경:</p>
              <EnvironmentIndicator />
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">테스트 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>이 페이지는 Google Maps API가 제대로 로드되는지 테스트합니다.</li>
            <li>각 단계별로 로그가 출력되며, 어디서 문제가 발생하는지 확인할 수 있습니다.</li>
            <li>지도가 정상적으로 표시되면 API가 제대로 작동하는 것입니다.</li>
            <li>지도를 클릭하면 좌표가 로그에 출력됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

