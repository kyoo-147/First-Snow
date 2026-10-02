const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchStr, replaceStr) {
  const content = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, content.replace(new RegExp(searchStr, 'g'), replaceStr));
}

// Fix SnowButton variant="outline" -> "soft"
const pagesPath = path.join(__dirname, 'src', 'components', 'pages');
const filesToFix = [
  'parent-children-screen.tsx',
  'parent-learning-screen.tsx',
  'parent-sessions-screen.tsx',
  'parent-timeline-screen.tsx',
  'parent-transcripts-screen.tsx'
];

filesToFix.forEach(f => {
  const fullPath = path.join(pagesPath, f);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath, 'variant="outline"', 'variant="soft"');
  }
});

// Fix AdminShell activeNav
const adminPagePath = path.join(__dirname, 'src', 'app', '(admin)', 'admin', 'page.tsx');
if (fs.existsSync(adminPagePath)) {
  replaceInFile(adminPagePath, ' activeNav="dashboard"', '');
}

console.log("Fixes applied.");
