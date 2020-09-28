const gulp = require('gulp'),
    puppeteer = require('puppeteer'),
    CronJob = require('cron').CronJob,
    fs = require('fs'),
    fetch = require('node-fetch'),
    lineNotify = require('line-notify-nodejs')('k1HyFePVyikdt0UtT14VQmfthZeKui34lplM1dIINuE');


const source = JSON.parse(fs.readFileSync('config/sources.json', 'utf8'));
const player = require('play-sound')(opts = {})

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

            result = await page.$eval(source.selector, e => e.innerText)
            result = result.toLowerCase()
            soldOutText = source.soldOutText.toLowerCase()

            if (result != soldOutText && result != "") {
                msg = source.siteName + " is AVAILABLE: " + url;
                console.log('AVAILABLE!!!')
                console.log(msg)
                player.play('alarm.mp3', function(err) {
                    if (err) throw err
                })
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

function checkNvidia(productID) {
    const url = "https://api-prod.nvidia.com/direct-sales-shop/DR/products/en_us/USD/" + productID;
    const settings = { method: "Get" }

    return fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            const name = json.products.product[0].name;
            const status = json.products.product[0].inventoryStatus.status;
            console.log("NVIDIA - Checking " + name)
            if (status != "PRODUCT_INVENTORY_OUT_OF_STOCK" || status == "PRODUCT_INVENTORY_IN_STOCK") {
                msg = name + " is AVAILABLE:";
                console.log(msg)
                player.play('alarm.mp3', function(err) {
                    if (err) throw err
                })
                lineNotify.notify({
                    message: msg
                }).then(() => {
                    console.log('Notify sent!');
                });

            } else if (status == "" || status == null || typeof(status) == "undefined") {
                console.log('Cannot check status')
            } else {
                console.log('Out of Stock')
            }
        }).catch(err => console.error("Could not fetch productID" + err));

}


function checkBestBuy(productID) {
    const url = "https://www.bestbuy.ca/api/v2/json/product/" + productID + "?currentRegion=ON&include=all&lang=en-CA"
    const settings = {
        method: 'GET',
        headers: {
            "User-Agent": "	Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0"
        }
    }
    return fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            const name = json.name;
            const status = json.availability.onlineAvailability;
            const numStock = json.availability.onlineAvailabilityCount;
            console.log("BESTBUY - Checking " + name)
            if (status != "NotYetAvailable" || status == "Preorder") {
                msg = name + " is AVAILABLE (" + numStock + "): ";
                console.log(msg)
                player.play('alarm.mp3', function(err) {
                    if (err) throw err
                })
                lineNotify.notify({
                    message: msg
                }).then(() => {
                    console.log('Notify sent!');
                });

            } else if (status == "" || status == null || typeof(status) == "undefined") {
                console.log('Cannot check status')
            } else {
                console.log('Out of Stock')
            }
        }).catch(err => console.error("Could not fetch productID" + err));

}

async function testSound() {
    return player.play('alarm.mp3', function(err) {
        if (err) throw err
    })
}

const job = new CronJob('* 6-23 * * *', function() {
    console.log(new Date());
    console.log('Starting job...');
    //checkAll();
    checkNvidia(5438481700);
    //checkNvidia(5379432400)
    checkBestBuy(14962185);
    checkBestBuy(14962184)

}, null, true, 'America/Toronto')

job.start();

gulp.task('checkAll', gulp.series(checkAll));
gulp.task('checkNvidia', gulp.series(checkNvidia));
gulp.task('checkBestBuy', gulp.series(checkBestBuy));
gulp.task('testNotify', gulp.series(testNotify));
gulp.task('testSound', gulp.series(testSound));