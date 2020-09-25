const gulp = require('gulp'),
    puppeteer = require('puppeteer'),
    CronJob = require('cron').CronJob,
    fs = require('fs'),
    lineNotify = require('line-notify-nodejs')('k1HyFePVyikdt0UtT14VQmfthZeKui34lplM1dIINuE');


const source = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));

//const source = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));

const State = Object.freeze({
    AVAILABLE: Symbol("Available"),
    BACKORDER: Symbol("Backorder"),
    SOLDOUT: Symbol("Sold Out"),
    CHECKING: Symbol("Checking"),
    ERROR: Symbol("Error"),
    UNKNOWN: Symbol("Unknown")
});

async function init_worker(source) {
    const browser = await puppeteer.launch({ headless: false });
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.bestbuy.ca", ['geolocation']);

    urls = source.urls;
    for (const url of urls) {
        const page = await browser.newPage();
        await page.setGeolocation({ latitude: 43.5807955, longitude: -79.7590747 })
        try {
            //console.log(url)
            await page.setViewport({ width: 1920, height: 768 });
            await page.goto(url, { waitUntil: 'load' });
            await page.waitForSelector(source.selector)
            const result = await page.$eval(source.selector, e => e.innerText)

            if (result != source.soldOutText) {
                msg = source.siteName + " is AVAILABLE: " + url;
                console.log('AVAILABLE!!!')
                console.log(msg)
           
                lineNotify.notify({
                    message: msg
                }).then(() => {
                    console.log('Notify sent!');
                });

            } else { console.log('SOLD OUT at ' + source.siteName + " || " + url) }

            await page.close()
        } catch (err) {
            console.error(err);
            await browser.close();
            throw new Error('page.goto/waitForSelector timed out.');
        }
    }

    await browser.close();
}

async function checkAll() {
    for (const site of source) {
        await init_worker(site)
    }
}

function testNotify() {
    return lineNotify.notify({
        message: 'send test',
    }).then(() => {
        console.log('send completed!');
    });
}

const job = new CronJob('* 6-23 * * *', function() {
    console.log(new Date());
    console.log('Starting job...');
    checkAll();
}, null, true, 'America/Toronto')

job.start();

gulp.task('checkAll', gulp.series(checkAll));
gulp.task('testNotify', gulp.series(testNotify));