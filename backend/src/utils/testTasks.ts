/**
 * Task별 테스트 실행 스크립트
 * 
 * 사용법:
 *   npm run test-tasks              # 모든 완료된 task 테스트
 *   npm run test-tasks 1 2 3       # 특정 task만 테스트
 */

import 'reflect-metadata';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  tags: string[];
}

interface TestResult {
  taskId: string;
  taskTitle: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  testFile?: string;
  message?: string;
  details?: string;
  duration?: number;
}

// Task ID와 테스트 파일 매핑
const TASK_TEST_MAPPING: { [key: string]: { testFile: string; description: string } } = {
  '1': { testFile: '1-project-structure.test.ts', description: '프로젝트 기본 구조 설정' },
  '2': { testFile: '2-database-models.test.ts', description: '데이터베이스 스키마 및 모델' },
  '3': { testFile: '3-auth-api.test.ts', description: '인증 시스템 백엔드 - 기본 기능' },
  '4': { testFile: 'frontend-auth.test.ts', description: '인증 시스템 프론트엔드 - 기본 기능 (수동 테스트 필요)' },
  '5': { testFile: '5-auth-provider.test.ts', description: '인증 제공자 추상화 레이어' },
  '6': { testFile: '6-user-profile.test.ts', description: '사용자 프로필 관리' },
  '7': { testFile: '7-phase-management.test.ts', description: 'Phase 관리 시스템' },
  '8': { testFile: '8-hint-generation.test.ts', description: '힌트 생성 시스템' },
  '9': { testFile: '9-admin-system.test.ts', description: 'Admin 시스템' },
  '10': { testFile: '10-submission-system.test.ts', description: '사용자 제출 및 정답 판별 시스템' },
  '11': { testFile: 'frontend-game.test.ts', description: '게임 플레이 프론트엔드 (수동 테스트 필요)' },
  '12': { testFile: 'frontend-styling.test.ts', description: '기본 스타일링 및 반응형 디자인 (수동 테스트 필요)' },
};

async function loadTasks(): Promise<Task[]> {
  const tasksPath = path.join(__dirname, '../../../.taskmaster/tasks/tasks.json');
  const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
  return tasksData.tasks.filter((task: Task) => task.status === 'completed');
}

async function runTest(testFile: string): Promise<{ success: boolean; output: string; duration: number }> {
  const testPath = path.join(__dirname, '../__tests__', testFile);
  const startTime = Date.now();

  try {
    // 테스트 파일 존재 확인
    if (!fs.existsSync(testPath)) {
      return {
        success: false,
        output: `테스트 파일이 없습니다: ${testFile}`,
        duration: 0,
      };
    }

    // Jest로 테스트 실행
    const { stdout, stderr } = await execAsync(
      `npx jest ${testFile} --no-coverage --silent`,
      {
        cwd: path.join(__dirname, '../..'),
        timeout: 60000, // 60초 타임아웃
      }
    );

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    // Jest 출력에서 성공/실패 판단
    const success = output.includes('PASS') || (!output.includes('FAIL') && !output.includes('Error'));

    return { success, output, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      output: error.message || String(error),
      duration,
    };
  }
}

async function testTask(task: Task, testMapping: { testFile: string; description: string }): Promise<TestResult> {
  console.log(`\n🧪 Task ${task.id}: ${task.title}`);
  console.log(`   ${testMapping.description}`);
  console.log(`   테스트 파일: ${testMapping.testFile}`);

  // 프론트엔드 테스트는 수동 테스트로 표시
  if (testMapping.testFile.startsWith('frontend-')) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      status: 'skipped',
      testFile: testMapping.testFile,
      message: '프론트엔드 테스트는 수동으로 확인해야 합니다.',
      details: '브라우저에서 직접 테스트하거나 E2E 테스트 도구를 사용하세요.',
    };
  }

  const result = await runTest(testMapping.testFile);

  if (result.success) {
    console.log(`   ✅ 통과 (${result.duration}ms)`);
    return {
      taskId: task.id,
      taskTitle: task.title,
      status: 'passed',
      testFile: testMapping.testFile,
      message: '모든 테스트 통과',
      duration: result.duration,
    };
  } else {
    console.log(`   ❌ 실패 (${result.duration}ms)`);
    console.log(`   에러: ${result.output.substring(0, 200)}...`);
    return {
      taskId: task.id,
      taskTitle: task.title,
      status: 'failed',
      testFile: testMapping.testFile,
      message: '테스트 실패',
      details: result.output.substring(0, 1000),
      duration: result.duration,
    };
  }
}

async function main() {
  console.log('🚀 Task별 테스트 시작\n');
  console.log('='.repeat(60));

  const tasks = await loadTasks();
  const args = process.argv.slice(2);
  const targetTaskIds = args.length > 0 ? args : tasks.map(t => t.id);

  const results: TestResult[] = [];

  for (const taskId of targetTaskIds) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log(`\n⚠️  Task ${taskId}를 찾을 수 없거나 완료되지 않았습니다.`);
      results.push({
        taskId,
        taskTitle: '알 수 없음',
        status: 'skipped',
        message: 'Task를 찾을 수 없습니다.',
      });
      continue;
    }

    const testMapping = TASK_TEST_MAPPING[taskId];
    if (!testMapping) {
      console.log(`\n⚠️  Task ${taskId}에 대한 테스트 파일이 정의되지 않았습니다.`);
      results.push({
        taskId,
        taskTitle: task.title,
        status: 'skipped',
        message: '테스트 파일이 정의되지 않았습니다.',
      });
      continue;
    }

    const result = await testTask(task, testMapping);
    results.push(result);

    // API 호출 간격 (너무 빠른 요청 방지)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  console.log(`\n✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`⏭️  건너뜀: ${skipped}개`);
  console.log(`📦 전체: ${results.length}개\n`);

  // 상세 결과
  console.log('상세 결과:');
  console.log('-'.repeat(60));
  results.forEach(result => {
    const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
    console.log(`${icon} Task ${result.taskId}: ${result.taskTitle}`);
    console.log(`   상태: ${result.status}`);
    if (result.message) {
      console.log(`   메시지: ${result.message}`);
    }
    if (result.duration) {
      console.log(`   소요 시간: ${result.duration}ms`);
    }
    if (result.details && result.status === 'failed') {
      console.log(`   상세: ${result.details.substring(0, 200)}...`);
    }
    console.log('');
  });

  // 결과를 JSON 파일로 저장
  const resultsPath = path.join(__dirname, '../../../test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      skipped,
    },
    results,
  }, null, 2));

  console.log(`\n📄 상세 결과가 저장되었습니다: ${resultsPath}`);

  // 실패한 테스트가 있으면 종료 코드 1 반환
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ 테스트 실행 중 오류 발생:', error);
  process.exit(1);
});


