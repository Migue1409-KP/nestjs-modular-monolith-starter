import { AppDataSource } from '../data-source';
import { seedLanguagesAndCountries } from './01-languages-countries.seeder';
import { seedNotificationTemplates } from './02-notification-templates.seeder';

async function runSeeders() {
  try {
    console.log('🌱 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('\n🌱 Running seeders in order...\n');

    // 1. Languages (base data)
    console.log('📝 Step 1/2: Languages...');
    await seedLanguagesAndCountries(AppDataSource);

    // 2. Notification templates used by auth emails (requires languages)
    console.log('📝 Step 2/2: Notification templates...');
    await seedNotificationTemplates(AppDataSource);

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
