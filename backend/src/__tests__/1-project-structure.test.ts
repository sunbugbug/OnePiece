/**
 * 태스크 1 테스트: 프로젝트 기본 구조 설정
 */
import fs from 'fs';
import path from 'path';

describe('Task 1: 프로젝트 기본 구조 설정', () => {
  const projectRoot = path.join(__dirname, '../../..');
  const frontendPath = path.join(projectRoot, 'frontend');
  const backendPath = path.join(projectRoot, 'backend');

  test('프론트엔드 디렉토리가 존재해야 함', () => {
    expect(fs.existsSync(frontendPath)).toBe(true);
  });

  test('백엔드 디렉토리가 존재해야 함', () => {
    expect(fs.existsSync(backendPath)).toBe(true);
  });

  test('프론트엔드 package.json이 존재해야 함', () => {
    const packageJsonPath = path.join(frontendPath, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
  });

  test('백엔드 package.json이 존재해야 함', () => {
    const packageJsonPath = path.join(backendPath, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
  });

  test('프론트엔드 tsconfig.json이 존재해야 함', () => {
    const tsconfigPath = path.join(frontendPath, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  test('백엔드 tsconfig.json이 존재해야 함', () => {
    const tsconfigPath = path.join(backendPath, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  test('백엔드 src 디렉토리 구조가 올바르게 구성되어야 함', () => {
    const requiredDirs = [
      'src/routes',
      'src/controllers',
      'src/middleware',
      'src/utils',
      'src/models',
      'src/config',
    ];

    requiredDirs.forEach((dir) => {
      const dirPath = path.join(backendPath, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  test('프론트엔드 app 디렉토리가 존재해야 함', () => {
    const appPath = path.join(frontendPath, 'app');
    expect(fs.existsSync(appPath)).toBe(true);
  });
});


