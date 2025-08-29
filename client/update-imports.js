import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .js files
function findJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.')) {
      files.push(...findJsFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to update import statements in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update import statements to use .jsx extensions
  content = content.replace(
    /from ['"](\.\/[^'"]*|\.\.\/[^'"]*)\.js['"]/g,
    (match, importPath) => {
      return `from '${importPath}.jsx'`;
    }
  );
  
  // Update import statements without extensions to use .jsx
  content = content.replace(
    /from ['"](\.\/[^'"]*|\.\.\/[^'"]*)(?!\.jsx?|\.tsx?|\.json)['"]/g,
    (match, importPath) => {
      // Skip if it's a package import or already has extension
      if (importPath.startsWith('.') && !importPath.includes('@')) {
        return `from '${importPath}.jsx'`;
      }
      return match;
    }
  );
  
  fs.writeFileSync(filePath, content);
}

// Function to rename file and update imports
function processFile(filePath) {
  const newPath = filePath.replace(/\.js$/, '.jsx');
  
  // Update imports first
  updateImports(filePath);
  
  // Rename the file
  fs.renameSync(filePath, newPath);
  console.log(`Renamed: ${filePath} -> ${newPath}`);
  
  return newPath;
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found!');
    return;
  }
  
  console.log('Finding .js files...');
  const jsFiles = findJsFiles(srcDir);
  
  if (jsFiles.length === 0) {
    console.log('No .js files found to process.');
    return;
  }
  
  console.log(`Found ${jsFiles.length} .js files to process:`);
  jsFiles.forEach(file => console.log(`  ${file}`));
  
  console.log('\nProcessing files...');
  
  // Process files in reverse order to avoid path issues
  jsFiles.reverse().forEach(file => {
    try {
      processFile(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
  
  console.log('\nAll files processed successfully!');
  console.log('Note: You may need to manually review some import statements.');
}

main();
