const { execSync } = require('child_process');

try {
  // Get all untracked and modified files
  const statusOutput = execSync('git status --porcelain').toString();
  const lines = statusOutput.split('\n').filter(line => line.trim() !== '');

  let commitCount = 0;

  for (const line of lines) {
    // line format is usually " M path/to/file" or "?? path/to/file"
    const filePath = line.substring(3).trim();
    
    if (filePath) {
      try {
        console.log(`Committing: ${filePath}`);
        execSync(`git add "${filePath}"`);
        
        let prefix = "Update";
        if (filePath.endsWith('.css')) prefix = "Style";
        if (filePath.endsWith('.tsx')) prefix = "Component";
        if (filePath.endsWith('.ts')) prefix = "Script";
        if (filePath.endsWith('.png')) prefix = "Asset";
        
        const message = `${prefix} ${filePath.split('/').pop()}`;
        
        execSync(`git commit -m "${message}"`);
        commitCount++;
      } catch (err) {
        console.error(`Error committing ${filePath}: ${err.message}`);
      }
    }
  }

  console.log(`Successfully created ${commitCount} commits!`);
} catch (error) {
  console.error('Failed to execute script:', error);
}
