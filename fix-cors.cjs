const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

const KEY_FILE = path.join(__dirname, 'service-account.json');

async function setCors() {
  if (!fs.existsSync(KEY_FILE)) {
    console.error('❌ ОШИБКА: Файл service-account.json не найден!');
    process.exit(1);
  }

  try {
    const storage = new Storage({ keyFilename: KEY_FILE });
    
    console.log('🔍 Поиск доступных бакетов...');
    const [buckets] = await storage.getBuckets();
    
    if (buckets.length === 0) {
      console.error('❌ ОШИБКА: В этом проекте не найдено ни одного бакета Storage. Пожалуйста, убедитесь, что вы создали Storage в Firebase Console.');
      process.exit(1);
    }

    const bucket = buckets[0];
    const BUCKET_NAME = bucket.name;

    const corsConfiguration = [
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
        maxAgeSeconds: 3600,
      },
    ];

    console.log(`📡 Настройка CORS для бакета ${BUCKET_NAME}...`);
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ УСПЕХ: CORS успешно настроен!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

setCors();
