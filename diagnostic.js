import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
    page.on('pageerror', error => console.log('[BROWSER PAGE ERROR]', error.message));
    page.on('requestfailed', request => {
      console.log('[BROWSER NETWORK ERROR]', request.url(), request.failure()?.errorText);
    });

    console.log('Navigating to http://127.0.0.1:5173/app ...');
    await page.goto('http://127.0.0.1:5173/app', { waitUntil: 'load', timeout: 60000 });
    
    console.log('Waiting 10 seconds for MambaBrain ticks to build up...');
    await new Promise(r => setTimeout(r, 10000));
    
    const pageData = await page.evaluate(() => {
      const root = document.getElementById('root');
      const sentinel = document.body.innerText.includes('SENTINEL');
      const backtest = document.body.innerText.includes('BACKTEST');
      return { 
        html: root?.innerHTML?.slice(0, 1000), 
        hasSentinel: sentinel,
        hasBacktest: backtest,
        text: document.body.innerText.slice(0, 500)
      };
    });
    
    console.log('[DIAGNOSTICS] Sentinel Panel Present:', pageData.hasSentinel);
    console.log('[DIAGNOSTICS] Backtest Badge Present:', pageData.hasBacktest);
    console.log('[DOM TEXT PREVIEW]\n' + pageData.text + '\n[...]');
    
    await browser.close();
    console.log('Diagnostics complete, browser closed.');
  } catch (err) {
    console.error('Diagnostic script failed:', err);
  }
})();
