const fs = require('fs');

const dirs = fs.readdirSync('src/app/profile');
const badDir = dirs.find(d => d.includes('username') && d !== '[username]');

if (badDir) {
  const badPath = 'src/app/profile/' + badDir;
  const goodPath = 'src/app/profile/[username]';
  
  if (!fs.existsSync(goodPath)) {
    fs.mkdirSync(goodPath, { recursive: true });
  }

  // Copy everything
  const items = fs.readdirSync(badPath, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      fs.cpSync(badPath + '/' + item.name, goodPath + '/' + item.name, { recursive: true });
    } else {
      fs.copyFileSync(badPath + '/' + item.name, goodPath + '/' + item.name);
    }
  }
  
  console.log('Copied ' + badPath + ' to ' + goodPath);
  
  try {
    fs.rmSync(badPath, { recursive: true, force: true });
    console.log('Deleted ' + badPath);
  } catch (err) {
    console.error('Could not delete ' + badPath + ': ' + err.message);
  }
} else {
  console.log('No bad dir found');
}
