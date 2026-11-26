const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.ECOMAP_PLAYWRIGHT || 'playwright');
const fs = require('node:fs/promises');

async function run() {
  const browser = await chromium.launch({executablePath:process.env.ECOMAP_BROWSER});
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000},offline:true,geolocation:{latitude:24.14754,longitude:120.68437},permissions:['geolocation']});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await fs.mkdir(path.resolve(__dirname,'../qa'),{recursive:true});
    await page.screenshot({path:path.resolve(__dirname,'../qa/desktop.png'),fullPage:true});
    assert.equal(await page.locator('.card').count(),49);
    assert.equal(await page.getByRole('button',{name:/查看店家 Hello早餐店/}).count(),0);
    const audited = await page.locator('.card button').evaluateAll(buttons => buttons.map(button => {
      button.click();
      const dialog = document.querySelector('#detail');
      const record = {
        options: dialog.querySelector('.order-panel select')?.options.length ?? 0,
        time: Boolean(dialog.querySelector('.seat-estimate .arrival-parts')),
        externalGoogleDirections: Boolean(dialog.querySelector('.store-map .actions a')),
        seatSource: [...dialog.querySelectorAll('a')].some(link => link.textContent.includes('席數來源')),
        seats: dialog.querySelector('.seat-output')?.textContent ?? '',
        wrongAddressButton: [...dialog.querySelectorAll('a')].some(link =>
          link.textContent.includes('門市地址來源') && link.href.includes('B80Gl3tRJy8'))
      };
      dialog.close();
      return record;
    }));
    assert.equal(audited.length,49);
    assert.ok(audited.every(row => row.options > 0 && row.time && !row.externalGoogleDirections && !row.seatSource && row.seats.includes('席') && !row.wrongAddressButton));
    const images = page.locator('.card img');
    assert.equal(await images.count(),49);
    assert.equal(await images.evaluateAll(async photos => {
      photos.forEach(photo => { photo.loading = 'eager'; });
      await Promise.all(photos.map(photo => photo.decode()));
      return photos.every(photo => photo.naturalWidth > 0);
    }),true);
    assert.equal(await page.getByText(/步行去程約/).count(),48);
    await page.locator('#sort').selectOption('default');
    const reordered = await page.evaluate(() => {
      document.getAnimations().forEach(animation => animation.finish());
      const card = document.querySelector('#cards article[data-store*="一中大本營"]');
      document.querySelector('#campus-origin').click();
      return card === document.querySelector('#cards article:first-child') &&
        card.getAnimations().length > 0 &&
        document.querySelector('#cards article').textContent.includes('一中大本營');
    });
    assert.equal(reordered,true);
    await page.locator('#my-location').click();
    await page.waitForFunction(() => document.querySelector('#cards article')?.textContent.includes('豐味綠豆沙'));
    await page.locator('#reset-origin').click();
    await page.getByRole('checkbox',{name:/座位/}).check();
    assert.equal(await page.locator('.card').count(),17);
    await page.getByRole('checkbox',{name:/座位/}).uncheck();
    await page.locator('#query').fill('豐仁冰');
    assert.equal(await page.locator('.card').count(),1);
    const detail = page.getByRole('button',{name:'查看店家 一中豐仁冰'});
    await detail.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('dialog').isVisible(),true);
    const map = page.locator('dialog iframe[title*="Google 地圖"]');
    const mapUrl = new URL(await map.getAttribute('src'));
    assert.equal(mapUrl.searchParams.get('daddr'),'一中豐仁冰 臺中市北區育才街3巷4號之6');
    assert.equal(mapUrl.searchParams.get('output'),'embed');
    assert.match(mapUrl.searchParams.get('saddr'),/三民校區/);
    const routeRequests = [];
    await page.route('https://valhalla1.openstreetmap.de/**', async request => {
      const url = new URL(request.request().url());
      const payload = JSON.parse(url.searchParams.get('json'));
      routeRequests.push(payload);
      const bike = payload.costing === 'bicycle';
      await request.fulfill({json:{code:'Ok',routes:[{
        legs:[{distance:bike ? 500 : 800},{distance:bike ? 650 : 1120}],
        geometry:{type:'LineString',coordinates:[[120.68437,24.14754],[120.686528,24.14896],[120.68437,24.14754]]}
      }]}});
    });
    await page.getByRole('button',{name:'顯示我的位置與路線'}).click();
    await page.getByText(/機車 · 去程 0\.80 km/).first().waitFor();
    assert.deepEqual(routeRequests[0].locations,[
      {lat:24.14754,lon:120.68437},{lat:24.14896,lon:120.686528},{lat:24.14754,lon:120.68437}
    ]);
    assert.equal(routeRequests[0].costing,'motor_scooter');
    const scooterMap = new URL(await map.getAttribute('src'));
    assert.equal(scooterMap.searchParams.get('saddr'),'24.14754,120.68437');
    assert.equal(scooterMap.searchParams.get('dirflg'),'l');
    assert.equal(await page.locator('[data-emission="traffic"]').textContent(),'0.173 kg CO₂e');
    await page.getByLabel('交通方式').selectOption('bike');
    await page.getByText(/單車 · 去程 0\.50 km · 回程 0\.65 km · 來回 1\.15 km/).first().waitFor();
    assert.equal(await page.locator('[data-emission="traffic"]').textContent(),'0.000 kg CO₂e');
    assert.equal(new URL(await map.getAttribute('src')).searchParams.get('dirflg'),'b');
    await page.getByLabel('交通方式').selectOption('transit');
    await page.getByText(/代估公車里程/).first().waitFor();
    assert.equal(routeRequests.at(-1).costing,'auto');
    assert.equal(await page.locator('[data-emission="traffic"]').textContent(),'0.150 kg CO₂e');
    assert.equal(new URL(await map.getAttribute('src')).searchParams.get('dirflg'),'r');
    await page.getByLabel('交通方式').selectOption('scooter');
    await page.getByRole('button',{name:'恢復校區距離'}).click();
    assert.equal(new URL(await map.getAttribute('src')).searchParams.get('daddr'),mapUrl.searchParams.get('daddr'));
    assert.equal(await page.locator('dialog').isVisible(),true);
    await page.getByLabel('交通方式').selectOption('transit');
    assert.equal(new URL(await map.getAttribute('src')).searchParams.get('dirflg'),'r');
    assert.equal(await page.locator('[data-emission="traffic"]').textContent(),'0.042 kg CO₂e');
    assert.match(await page.locator('.order-panel').textContent(),/校區步行往返距離代估公車里程/);
    assert.match(await page.locator('[data-emission="total"]').textContent(),/^\d+\.\d{3} kg CO₂e$/);
    await page.getByLabel('交通方式').selectOption('scooter');
    assert.match(await page.locator('.order-panel').textContent(),/步行去程約 0\.27 km · 來回約 0\.54 km/);
    assert.equal(await page.locator('[data-emission="traffic"]').textContent(),'0.048 kg CO₂e');
    assert.match(await page.locator('.seat-estimate').textContent(),/18–24 席/);
    assert.match(await page.locator('.seat-estimate').textContent(),/14:00–17:00/);
    assert.match(await page.locator('.seat-output').textContent(),/預估剩 1–10 席/);
    assert.equal(await page.getByLabel(/假設總座位/).count(),0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(),false);
    assert.equal(await detail.evaluate(e=>e===document.activeElement),true);
    await page.locator('#query').fill('統元豆花');
    await page.getByRole('button',{name:'查看店家 統元豆花'}).click();
    assert.equal(await page.locator('dialog a[href*="if.nutc.edu.tw"]').count(),0);
    assert.equal(await page.getByRole('link',{name:/門市地址來源/}).count(),1);
    assert.equal(await page.locator('dialog iframe[title*="Google 地圖"]').count(),1);
    assert.match(await page.locator('.seat-estimate').textContent(),/總座位約 20 席/);
    assert.match(await page.locator('.seat-output').textContent(),/剩 2–8 席/);
    await page.getByLabel('到店小時').selectOption('17');
    await page.getByLabel('到店分鐘').selectOption('30');
    assert.match(await page.locator('.seat-output').textContent(),/離峰/);
    await page.getByLabel('到店小時').selectOption('14');
    await page.getByLabel('到店分鐘').selectOption('00');
    await page.getByLabel('日期類型').selectOption('weekend');
    assert.match(await page.locator('.seat-output').textContent(),/剩 0–5 席/);
    await page.keyboard.press('Escape');
    await page.locator('#query').fill('');
    await page.locator('#kind').selectOption('麵食');
    assert.equal(await page.locator('.card').count(),5);
    await page.getByRole('button',{name:'查看店家 日嚐拉麵館'}).click();
    assert.deepEqual(await page.getByLabel('想點什麼？').locator('option').allTextContents(),['九州豚骨拉麵','蒜香味噌拉麵']);
    await page.keyboard.press('Escape');
    await page.locator('#kind').selectOption('鍋物');
    await page.getByRole('button',{name:'查看店家 泰丘鍋物'}).click();
    const dish = page.getByLabel('想點什麼？');
    assert.deepEqual(await dish.locator('option').allTextContents(),['青焰綠咖哩鍋底','皇家冬蔭鍋底','濃純豚骨牛奶鍋底']);
    const initial = await page.locator('[data-emission="meal"]').textContent();
    await dish.selectOption('thaiTomYum');
    assert.notEqual(await page.locator('[data-emission="meal"]').textContent(),initial);
    assert.match(await page.getByRole('link',{name:/查看品項來源/}).getAttribute('href'),/230xuydq/);
    assert.equal(await page.locator('#carbon').count(),0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#dataset').count(),0);
    await page.locator('#kind').selectOption('');
    await page.getByRole('button',{name:'查看店家 阿里山鐵道紅茶冰',exact:true}).click();
    const teaBefore = await page.locator('[data-emission=meal]').textContent();
    await page.getByLabel('想點什麼？').selectOption('freshTea');
    assert.notEqual(await page.locator('[data-emission=meal]').textContent(),teaBefore);
    assert.equal(await page.getByLabel('想點什麼？').locator('option').count(),6);
    await page.keyboard.press('Escape');
    await page.locator('#kind').selectOption('');
    await page.locator('#query').fill('不存在的店名');
    assert.equal(await page.locator('.card').count(),0);
    await page.locator('#reset').click();
    assert.equal(await page.locator('.card').count(),49);
    assert.deepEqual(errors,[]);
    for (const width of [320,390,768]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
      await page.getByRole('button',{name:'查看店家 山裏山外',exact:true}).click();
      const layout = await page.locator('#detail-body').evaluate(body => {
        const close = document.querySelector('#detail .close');
        const closeTop = close.getBoundingClientRect().top;
        const time = [...body.querySelectorAll('.arrival-parts select')].map(control => control.getBoundingClientRect());
        const seat = body.querySelector('.seat-estimate').getBoundingClientRect();
        const map = body.querySelector('iframe').getBoundingClientRect();
        const bounds = body.getBoundingClientRect();
        body.scrollTop = body.scrollHeight;
        return {
          timeFits: time.length === 2 && time.every(control => control.width > 0 && control.left >= seat.left && control.right <= seat.right),
          mapFits: map.width > 0 && map.left >= bounds.left && map.right <= bounds.right,
          noOverflow: body.scrollWidth <= body.clientWidth,
          closeStays: body.scrollTop > 0 && close.getBoundingClientRect().top === closeTop,
          unitsStayTogether: [...body.querySelectorAll('.meal-results dd')].every(value =>
            getComputedStyle(value).whiteSpace === 'nowrap' && value.scrollWidth <= value.clientWidth)
        };
      });
      assert.deepEqual(layout,{timeFits:true,mapFits:true,noOverflow:true,closeStays:true,unitsStayTogether:true});
      await page.getByRole('button',{name:'關閉店家詳情'}).click();
    }
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.resolve(__dirname,'../qa/mobile.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('PASS: Offline desktop, 320/390/768 px layouts, keyboard and focus return, search, filter, reset, navigation URL, four-mode calculation, zero page errors.');
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode=1; });
