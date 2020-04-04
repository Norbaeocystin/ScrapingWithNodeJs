#!/bin/bash
#api point example below
# 'http://<server ip>:3000/api?url=http://topky.sk'
yes | apt update
yes | apt install nodejs
yes | apt install npm
yes | apt install screen
yes | apt-get install gconf-service libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxss1 libxtst6 libappindicator1 libnss3 libasound2 libatk1.0-0 libc6 ca-certificates fonts-liberation lsb-release xdg-utils wget
npm install express --save
npm install puppeteer
npm install puppeteer-extra
npm install puppeteer-extra-plugin-stealth
cat <<EOT >> index.js
const express = require('express')
const app = express()
const puppeteer = require('puppeteer-extra')
// Enable stealth plugin with all evasions
puppeteer.use(require('puppeteer-extra-plugin-stealth')())

async function get_html(url){
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    args: [
'--no-sandbox',
'--disable-setuid-sandbox',
'--disable-infobars',
'--window-position=0,0',
'--ignore-certifcate-errors',
'--ignore-certifcate-errors-spki-list',
'--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
],
    headless: true
  })
  const page = await browser.newPage()
 
  // Navigate to the page that will perform the tests.
  await page.goto(url)
 await page.waitFor(1 * 3000);
  // Save a screenshot of the results.
  let html = await page.content();
  await browser.close();
    return await html;
}

app.get("/api", (req, res, next) => {
    var query = req.query
    var re = / /g;
    var url = query.url.replace(re,'+');
    var html = get_html(url);
    html.then(function(values) {
      res.send(values);
    }).catch(function(e) {
        console.log(e)
  res.send(e); // "oh, no!"
});
    });

app.listen(3000)
EOT
nohup node index.js &
