import { AppDataSource } from '../data-source';
import { seedLanguages } from './01-languages-countries.seeder';

async function runSeeders() {
  try {
    console.log('🌱 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('\n🌱 Running seeders in order...\n');

    // 1. Languages (base data)
    console.log('📝 Step 1/1: Languages...');
    await seedLanguages(AppDataSource);

    console.log('\n✅ All seeders completed successfully');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

runSeeders();
