// Renders docs/report.html -> docs/report.pdf with Playwright's Chromium.
import { chromium } from '@playwright/test';
import path from 'node:path';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.resolve('docs/report.html'));
await page.pdf({ path: 'docs/report.pdf', format: 'A4', preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log('docs/report.pdf written');
