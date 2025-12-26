'use client';

export default function DebugEnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">환경 변수 확인</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">NEXT_PUBLIC_API_URL</h2>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              {apiUrl || '❌ 설정되지 않음'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              예상값: http://localhost:3001/api
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</h2>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
              {mapsApiKey 
                ? `${mapsApiKey.substring(0, 20)}...${mapsApiKey.substring(mapsApiKey.length - 10)}` 
                : '❌ 설정되지 않음'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              전체 키 길이: {mapsApiKey ? mapsApiKey.length : 0}자
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">포트 설정 안내</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>프론트엔드 실행 포트: <strong>3000</strong> (Next.js 기본값)</li>
              <li>백엔드 실행 포트: <strong>3001</strong></li>
              <li>Google Maps API 키 제한: <strong>localhost:3000</strong> (프론트엔드 포트) ✅</li>
              <li>NEXT_PUBLIC_API_URL: <strong>localhost:3001/api</strong> (백엔드 API) ✅</li>
            </ul>
            <p className="text-sm text-blue-700 mt-3">
              <strong>중요:</strong> Google Maps API 키 제한은 프론트엔드가 실행되는 포트(3000)를 기준으로 설정합니다.
              백엔드 포트(3001)와는 무관합니다.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">환경 변수 로드 상태</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${apiUrl ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">
                  NEXT_PUBLIC_API_URL: {apiUrl ? '✅ 로드됨' : '❌ 로드되지 않음'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${mapsApiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: {mapsApiKey ? '✅ 로드됨' : '❌ 로드되지 않음'}
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>참고:</strong> 브라우저 콘솔에서는 <code className="bg-yellow-100 px-1 rounded">process.env</code>에 직접 접근할 수 없습니다. 
                Next.js는 빌드 시 <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_</code> 접두사가 있는 환경 변수를 JavaScript 번들에 인라인합니다.
                위의 값들이 표시되면 환경 변수가 정상적으로 로드된 것입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

