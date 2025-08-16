const fs = require('fs');
const path = require('path');

function cleanTempImages() {
  const tempDir = path.join(__dirname, '../temp');
  const publicDir = path.join(__dirname, '../public/temp');
  const frontendPublicDir = path.join(__dirname, '../frontend/public/temp');
  
  const directories = [tempDir, publicDir, frontendPublicDir];
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdir(dir, (err, files) => {
        if (err) {
          console.error(`❌ Error reading directory ${dir}:`, err);
          return;
        }
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          const now = Date.now();
          const fileAge = now - stats.mtime.getTime();
          const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
          
          if (fileAge > oneHour) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`❌ Error deleting ${filePath}:`, err);
              } else {
                console.log(`🗑️  Deleted old temp file: ${file}`);
              }
            });
          }
        });
      });
    }
  });
  
  console.log('✅ Temp image cleanup completed');
}

cleanTempImages();