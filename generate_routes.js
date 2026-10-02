const fs = require('fs');
const path = require('path');

const routesToCreate = [
  'children/page.tsx',
  'children/[childId]/sessions/page.tsx',
  'children/[childId]/timeline/page.tsx',
  'children/[childId]/transcripts/page.tsx',
  'children/[childId]/learning/page.tsx',
  'children/[childId]/routines/page.tsx',
  'alerts/page.tsx',
  'alerts/[alertId]/page.tsx',
  'privacy/page.tsx',
  'consent/page.tsx',
  'settings/notifications/page.tsx',
  'settings/emergency/page.tsx',
  'settings/account/page.tsx'
];

const basePath = path.join(__dirname, 'src', 'app', '(parent)', 'parent');

routesToCreate.forEach(route => {
  const fullPath = path.join(basePath, route);
  const dirPath = path.dirname(fullPath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const pageName = route.split('/').slice(-2, -1)[0] || 'Page';
  const content = `import { ParentShell } from "@/components/parent/parent-shell";

export default function Page() {
  return (
    <ParentShell activeNav="${pageName}">
      <div className="p-8">
        <h1 className="text-2xl font-black text-snow-primary-dark capitalize">${pageName.replace(/\[|\]/g, '')} Placeholder</h1>
        <p className="mt-4 text-snow-muted">This page is under construction.</p>
      </div>
    </ParentShell>
  );
}
`;
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log('Created:', route);
  }
});
