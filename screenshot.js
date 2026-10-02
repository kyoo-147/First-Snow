const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  // Parent
  { url: '/parent', name: 'parent-dashboard' },
  { url: '/parent/children', name: 'parent-children' },
  { url: '/parent/children/minh', name: 'parent-children-minh' },
  { url: '/parent/children/minh/sessions', name: 'parent-children-sessions' },
  { url: '/parent/children/minh/timeline', name: 'parent-children-timeline' },
  { url: '/parent/children/minh/transcripts', name: 'parent-children-transcripts' },
  { url: '/parent/children/minh/learning', name: 'parent-children-learning' },
  { url: '/parent/children/minh/routines', name: 'parent-children-routines' },
  { url: '/parent/alerts', name: 'parent-alerts' },
  { url: '/parent/privacy', name: 'parent-privacy' },
  { url: '/parent/consent', name: 'parent-consent' },
  { url: '/parent/settings', name: 'parent-settings' },
  { url: '/parent/settings/notifications', name: 'parent-notifications' },
  { url: '/parent/settings/emergency', name: 'parent-emergency' },
  { url: '/parent/settings/account', name: 'parent-account' },
  // Child
  { url: '/session/home', name: 'child-home' },
  { url: '/session/lessons', name: 'child-lessons' },
  { url: '/session/lessons/feelings-practice', name: 'child-lessons-feelings' },
  { url: '/session/activities', name: 'child-activities' },
  { url: '/session/routine', name: 'child-routine' },
  { url: '/session/calm-break', name: 'child-calm-break' },
  { url: '/session/complete', name: 'child-complete' },
  // Admin
  { url: '/admin', name: 'admin-dashboard' },
  { url: '/admin/companion', name: 'admin-companion' },
  { url: '/admin/companion/live2d', name: 'admin-companion-live2d' },
  { url: '/admin/companion/asr', name: 'admin-companion-asr' },
  { url: '/admin/companion/tts', name: 'admin-companion-tts' },
  { url: '/admin/companion/agent', name: 'admin-companion-agent' },
  { url: '/admin/vision', name: 'admin-vision' },
  { url: '/admin/system', name: 'admin-system' }
];

const RESPONSIVE_ROUTES = [
  '/parent',
  '/session/home',
  '/parent/settings',
  '/admin'
];

const VIEWPORTS = [
  { width: 360, height: 800, name: '360px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1024, height: 768, name: '1024px' },
  { width: 1440, height: 900, name: '1440px' }
];

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\trand\\.gemini\\antigravity-ide\\brain\\91e75d4b-a74b-492d-bbf4-2fc7807671d8';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const results = [];

  for (const route of ROUTES) {
    console.log(`Processing ${route.name}...`);
    try {
      const response = await page.goto(`${BASE_URL}${route.url}`, { waitUntil: 'networkidle' });
      // Wait a bit for animations
      await page.waitForTimeout(1000);
      
      const is404 = response.status() === 404;
      
      // Default capture at 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      const mainPath = path.join(OUT_DIR, `${route.name}-1440px.png`);
      await page.screenshot({ path: mainPath });
      
      results.push({
        route: route.url,
        name: route.name,
        file: `${route.name}-1440px.png`,
        status: is404 ? 'fail (404)' : 'pass',
      });

      if (RESPONSIVE_ROUTES.includes(route.url)) {
        for (const vp of VIEWPORTS) {
          if (vp.width === 1440) continue; // already taken
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(500); // Wait for responsive transitions
          const vpPath = path.join(OUT_DIR, `${route.name}-${vp.name}.png`);
          await page.screenshot({ path: vpPath });
          
          results.push({
            route: route.url,
            name: `${route.name} (${vp.name})`,
            file: `${route.name}-${vp.name}.png`,
            status: is404 ? 'fail (404)' : 'pass',
          });
        }
      }
    } catch (e) {
      console.error(`Failed ${route.url}:`, e.message);
      results.push({
        route: route.url,
        name: route.name,
        file: 'N/A',
        status: 'error',
      });
    }
  }

  await browser.close();
  
  // Write report
  let md = '# UI Screenshot Report\n\n';
  md += '| Route | Screenshot | Status | Notes |\n';
  md += '|-------|------------|--------|-------|\n';
  for (const r of results) {
    const link = r.file !== 'N/A' ? `[${r.file}](file:///${OUT_DIR.replace(/\\/g, '/')}/${r.file})` : 'N/A';
    md += `| ${r.route} | ${link} | ${r.status} | |\n`;
  }
  
  fs.writeFileSync(path.join(OUT_DIR, 'ui_screenshot_report.md'), md);
  console.log('Report generated.');
}

main().catch(console.error);
