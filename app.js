const puppeteer = require('puppeteer'),
    fs = require('fs');


const source = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));

const State = Object.freeze({
    AVAILABLE: Symbol("Available"),
    BACKORDER: Symbol("Backorder"),
    SOLDOUT: Symbol("Sold Out"),
    CHECKING: Symbol("Checking"),
    ERROR: Symbol("Error"),
    UNKNOWN: Symbol("Unknown")
});

/*  Assigning Enums
const obj = { id: "id", status: State.AVAILABLE}
if (obj.status === State.AVAILABLE) { console.log("match")} else { console.log("not match")}
*/

async function init_worker(source) {
    const browser = await puppeteer.launch({ headless: false });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.bestbuy.ca", ['geolocation']);


    for (const site of source) {
        urls = site.urls;
        for (const url of urls) {
            const page = await browser.newPage();
            await page.setGeolocation({ latitude: 43.5807955, longitude: -79.7590747 })
            try {
                console.log(url)
                await page.setViewport({ width: 1366, height: 768 });
                await page.goto(url, { waitUntil: 'networkidle0' });
                await page.waitForSelector(source.selector)
                const result = await page.$eval(source.selector, e => e.innerText)

                if (result != source.soldOutText) {
                    console.log('AVAILABLE')
                } else { console.log('SOLD OUT') }

                await page.close()
            } catch (err) {
                console.error(err);
                await browser.close();
                throw new Error('page.goto/waitForSelector timed out.');
            }
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

    } catch (err) {

        console.error(err);
        await browser.close();
        throw new Error('page.goto/waitForSelector timed out.');


    }

    await browser.close();
}

init_worker(source)