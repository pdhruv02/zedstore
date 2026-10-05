import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const sizes=[['desktop',1600,900],['mobile',390,844],['small-mobile',360,740],['narrow',320,568],['tablet',820,1180],['landscape',844,390]];
const chapters=['hero','products','fit','story','contact'];
for(const [name,width,height] of sizes){
  const mobile=width<=960;
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.locator('[data-nabz-entry]').waitFor({state:'detached'});
  await expect(page.locator('.nabz-identity h1')).toHaveCSS('opacity','1');
  for(let i=0;i<chapters.length;i++){
    if(i){
      if(mobile)await page.locator(`[data-mobile-chapter="${i}"]`).click();
      else await page.locator(`.nabz-site-header__nav a[href="#${chapters[i]}"]`).click();
    }
    await expect(page.locator(`#${chapters[i]}`)).toHaveCSS('opacity','1');
    await page.waitForTimeout(350);
    await page.screenshot({path:`nabz-review-${name}-${chapters[i]}.png`});
    if(i===0){await page.getByRole('button',{name:'Thread, seen closer'}).click();await page.waitForTimeout(600);await page.screenshot({path:`nabz-review-${name}-detail.png`});await page.getByRole('button',{name:'Back to the shirt'}).click();}
    if(i===2){
      if(mobile){await page.getByRole('tab',{name:'Illustration',exact:true}).click();await page.screenshot({path:`nabz-review-${name}-illustration.png`});await page.getByRole('tab',{name:'System',exact:true}).click();}
      else await page.getByRole('tab',{name:'The system',exact:true}).click();
      await page.waitForTimeout(550);
      await page.screenshot({path:`nabz-review-${name}-system.png`});
    }
  }
  await page.close();
}
await browser.close();
