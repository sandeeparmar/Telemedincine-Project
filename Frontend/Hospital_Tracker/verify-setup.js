#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * Checks if the project is properly set up for Vercel deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to check file/directory existence
function fileExists(filePath, type = 'file') {
  const fullPath = path.join(__dirname, filePath);
  try {
    const stats = fs.statSync(fullPath);
    if (type === 'file') return stats.isFile();
    if (type === 'directory') return stats.isDirectory();
    return true;
  } catch {
    return false;
  }
}

// Helper function to check if file contains text
function fileContains(filePath, searchText) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes(searchText);
  } catch {
    return false;
  }
}

console.log('\n🔍 Vercel Deployment Verification\n');
console.log('=' .repeat(50));

// Check 1: Project structure
console.log('\n✓ Checking project structure...');

const requiredDirs = [
  'src',
  'server',
  'api',
  'public',
  'server/config',
  'server/controllers',
  'server/models',
  'server/routes',
  'server/services'
];

requiredDirs.forEach(dir => {
  if (fileExists(dir, 'directory')) {
    checks.passed.push(`✅ Directory exists: ${dir}`);
  } else {
    checks.failed.push(`❌ Missing directory: ${dir}`);
  }
});

// Check 2: Critical files
console.log('\n✓ Checking critical files...');

const requiredFiles = [
  'package.json',
  'vite.config.js',
  'vercel.json',
  '.env.example',
  '.gitignore',
  'server/server.js',
  'src/App.jsx',
  'src/main.jsx',
  'index.html',
  'api/index.js'
];

requiredFiles.forEach(file => {
  if (fileExists(file, 'file')) {
    checks.passed.push(`✅ File exists: ${file}`);
  } else {
    checks.failed.push(`❌ Missing file: ${file}`);
  }
});

// Check 3: package.json configuration
console.log('\n✓ Checking package.json...');

try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );

  const requiredDeps = [
    'express',
    'mongoose',
    'cors',
    'dotenv',
    'react',
    'axios',
    'socket.io-client'
  ];

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      checks.passed.push(`✅ Dependency installed: ${dep}`);
    } else {
      checks.failed.push(`❌ Missing dependency: ${dep}`);
    }
  });

  // Check scripts
  const requiredScripts = ['build', 'dev', 'server:dev'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      checks.passed.push(`✅ Script defined: ${script}`);
    } else {
      checks.failed.push(`❌ Missing script: ${script}`);
    }
  });
} catch (error) {
  checks.failed.push(`❌ Error reading package.json: ${error.message}`);
}

// Check 4: Environment configuration
console.log('\n✓ Checking environment setup...');

if (fileExists('.env.example', 'file')) {
  checks.passed.push(`✅ .env.example exists`);
  
  if (!fileExists('.env', 'file') && !fileExists('.env.local', 'file')) {
    checks.warnings.push(`⚠️  No .env or .env.local file found (create for local development)`);
  } else {
    checks.passed.push(`✅ Local environment file exists`);
  }
} else {
  checks.failed.push(`❌ .env.example not found`);
}

// Check 5: Vercel configuration
console.log('\n✓ Checking Vercel configuration...');

try {
  const vercelJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8')
  );

  if (vercelJson.routes) {
    checks.passed.push(`✅ Vercel routes configured`);
  } else {
    checks.failed.push(`❌ Vercel routes not configured`);
  }

  if (vercelJson.buildCommand) {
    checks.passed.push(`✅ Build command defined`);
  } else {
    checks.warnings.push(`⚠️  Build command not defined in vercel.json`);
  }
} catch (error) {
  checks.failed.push(`❌ Error reading vercel.json: ${error.message}`);
}

// Check 6: Important imports in key files
console.log('\n✓ Checking imports and exports...');

if (fileContains('api/index.js', 'export default')) {
  checks.passed.push(`✅ api/index.js exports default app`);
} else {
  checks.failed.push(`❌ api/index.js doesn't export default`);
}

if (fileContains('server/server.js', 'listen')) {
  checks.passed.push(`✅ server/server.js listens on port`);
} else {
  checks.failed.push(`❌ server/server.js might not start correctly`);
}

// Check 7: Git configuration
console.log('\n✓ Checking Git configuration...');

if (fileExists('.gitignore', 'file')) {
  checks.passed.push(`✅ .gitignore exists`);
  
  if (fileContains('.gitignore', '.env')) {
    checks.passed.push(`✅ .env files ignored in Git`);
  } else {
    checks.warnings.push(`⚠️  .env files might not be ignored (add to .gitignore)`);
  }
} else {
  checks.warnings.push(`⚠️  .gitignore not found`);
}

// Print results
console.log('\n' + '='.repeat(50));
console.log('\n📋 VERIFICATION RESULTS:\n');

if (checks.passed.length > 0) {
  console.log('✅ PASSED CHECKS:');
  checks.passed.forEach(check => console.log(`   ${check}`));
}

if (checks.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  checks.warnings.forEach(warning => console.log(`   ${warning}`));
}

if (checks.failed.length > 0) {
  console.log('\n❌ FAILED CHECKS:');
  checks.failed.forEach(failed => console.log(`   ${failed}`));
}

// Summary
console.log('\n' + '='.repeat(50));
const totalChecks = checks.passed.length + checks.failed.length + checks.warnings.length;
const passRate = ((checks.passed.length / totalChecks) * 100).toFixed(1);

console.log(`\n📊 Summary: ${checks.passed.length}/${totalChecks} checks passed (${passRate}%)\n`);

if (checks.failed.length === 0) {
  console.log('✅ Project is ready for Vercel deployment!\n');
  process.exit(0);
} else {
  console.log('❌ Fix the failed checks before deploying to Vercel.\n');
  process.exit(1);
}
