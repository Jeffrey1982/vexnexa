// Quick test of the headless scanner
const { runRobustAccessibilityScan } = require('./src/lib/scanner-headless.ts');

async function testScanner() {
  try {
    console.log('Testing headless scanner with example.com...');
    const result = await runRobustAccessibilityScan('https://example.com');
    console.log('Scanner result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Scanner test failed:', error);
  }
}

testScanner();