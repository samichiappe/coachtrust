#!/usr/bin/env node

/**
 * Debug script to run Jest tests and identify issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Debugging Jest Test Issues...\n');

// Run Jest with verbose output to see what's happening
const jestArgs = [
  'test',
  '__tests__/unit/escrow.test.ts',
  '--verbose',
  '--no-cache',
  '--detectOpenHandles',
  '--runInBand'
];

console.log(`Running: npx jest ${jestArgs.join(' ')}`);
console.log('Working directory:', process.cwd());
console.log('Test file path:', path.resolve('__tests__/unit/escrow.test.ts'));

const jestProcess = spawn('npx', ['jest', ...jestArgs], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

jestProcess.on('close', (code) => {
  console.log(`\n📊 Jest process exited with code ${code}`);
  
  if (code === 0) {
    console.log('✅ Tests passed successfully!');
  } else {
    console.log('❌ Tests failed or encountered errors');
    console.log('\n🔧 Potential fixes to try:');
    console.log('1. Check import paths in test file');
    console.log('2. Verify TypeScript compilation');
    console.log('3. Check jest.config.js setup');
    console.log('4. Run: npm run build');
    console.log('5. Clear Jest cache: npx jest --clearCache');
  }
});

jestProcess.on('error', (error) => {
  console.error('❌ Failed to start Jest process:', error);
});
