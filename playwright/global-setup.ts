import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Setting up E2E database...');
  // Migrate the E2E database to ensure tables exist
  execSync('E2E_TEST=1 python manage.py migrate', { cwd: './backend', stdio: 'inherit' });
  
  // Safely flush all data without recreating the file or breaking file descriptors
  execSync('E2E_TEST=1 python manage.py flush --no-input', { cwd: './backend', stdio: 'inherit' });
  
  // Seed the E2E database
  execSync('E2E_TEST=1 python manage.py seed_test_db', { cwd: './backend', stdio: 'inherit' });
  console.log('E2E database setup complete.');
}

export default globalSetup;
