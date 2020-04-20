const puppeteer = require('puppeteer'),
    fs = require('fs');




const source = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));

const url = 'https://www.bestbuy.ca/en-ca/product/nintendo-switch-lite-coral/14457223'
const selector = '.x-pdp-availability-online.onlineAvailabilityContainer_Z02qk > div > div > span:nth-child(2)'
const soldOutText = 'Sold out online'



async function init_worker(source) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    urls = source.urls


    for (const url of urls) {

        try {
            console.log(url)
            await page.goto(url, { waitUntil: 'load' });
            const result = await page.$eval(source.selector, e => e.innerText)
            if (result != soldOutText) {
                console.log('AVAILABLE')
            } else { console.log('SOLD OUT') }

        } catch {
            console.error(err);
            await browser.close();
            throw new Error('page.goto/waitForSelector timed out.');
        }
    }

    await browser.close();
}




async function check_stock(url, selector, soldOutValue) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'load' });
        await page.waitForSelector(selector);
        const result = await page.$eval(selector, e => e.innerText)


        if (result != soldOutText) {
            console.log('AVAILABLE')
        } else { console.log('SOLD OUT') }

    } catch {

        console.error(err);
        await browser.close();
        throw new Error('page.goto/waitForSelector timed out.');


    }

    await browser.close();
}

init_worker(source)