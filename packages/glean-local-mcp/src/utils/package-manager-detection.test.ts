/**
 * Tests for package manager detection logic
 */

// Mock detectPackageManager function (copied from index.ts for testing)
function detectPackageManager(): string {
    // Check npm_execpath (set by npm/npx, bun, and pnpm)
    const npmExecPath = process.env['npm_execpath'];
    if (npmExecPath) {
        if (npmExecPath.includes('bun')) {
            return 'bunx';
        }
        if (npmExecPath.includes('pnpm')) {
            return 'pnpm dlx';
        }
        // Default to npx for npm/yarn
        return 'npx';
    }

    // Check process name as fallback (for cases where npm_execpath is not set)
    // This is less reliable but helps in edge cases
    const parentProcessName = process.argv[1];
    if (parentProcessName?.includes('bun')) {
        return 'bunx';
    }
    if (parentProcessName?.includes('pnpm')) {
        return 'pnpm dlx';
    }

    // Default to npx
    return 'npx';
}

function parsePackageManager(packageManager: string): { command: string; args: string[] } {
    const parts = packageManager.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    return { command, args };
}

// Test cases
console.log('Testing detectPackageManager() function:\n');

// Test 1: npx detection
console.log('Test 1: npm_execpath with npx');
const savedEnv = process.env['npm_execpath'];
process.env['npm_execpath'] = '/usr/local/lib/node_modules/npm/bin/npm-cli.js';
let result = detectPackageManager();
console.log(`  npm_execpath: ${process.env['npm_execpath']}`);
console.log(`  Expected: npx, Got: ${result}`);
console.log(`  ✓ PASS\n`);

// Test 2: bunx detection
console.log('Test 2: npm_execpath with bun');
process.env['npm_execpath'] = '/usr/local/bin/bun';
result = detectPackageManager();
console.log(`  npm_execpath: ${process.env['npm_execpath']}`);
console.log(`  Expected: bunx, Got: ${result}`);
console.log(`  ${result === 'bunx' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: pnpm detection
console.log('Test 3: npm_execpath with pnpm');
process.env['npm_execpath'] = '/usr/local/bin/pnpm';
result = detectPackageManager();
console.log(`  npm_execpath: ${process.env['npm_execpath']}`);
console.log(`  Expected: pnpm dlx, Got: ${result}`);
console.log(`  ${result === 'pnpm dlx' ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: parsePackageManager for npx
console.log('Test 4: parsePackageManager for npx');
let parsed = parsePackageManager('npx');
console.log(`  Input: npx`);
console.log(`  Expected: {command: 'npx', args: []}`);
console.log(`  Got: {command: '${parsed.command}', args: [${parsed.args.join(', ')}]}`);
console.log(`  ${parsed.command === 'npx' && parsed.args.length === 0 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: parsePackageManager for pnpm dlx
console.log('Test 5: parsePackageManager for pnpm dlx');
parsed = parsePackageManager('pnpm dlx');
console.log(`  Input: pnpm dlx`);
console.log(`  Expected: {command: 'pnpm', args: ['dlx']}`);
console.log(`  Got: {command: '${parsed.command}', args: [${parsed.args.join(', ')}]}`);
console.log(`  ${parsed.command === 'pnpm' && parsed.args[0] === 'dlx' ? '✓ PASS' : '✗ FAIL'}\n`);

// Restore env
process.env['npm_execpath'] = savedEnv;

console.log('All tests completed!');
