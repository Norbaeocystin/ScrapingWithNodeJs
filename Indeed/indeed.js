/*
node --max-old-space-size=4096 indeed.js
*/
const request = require('request-promise');
const cheerio = require('cheerio');
const mongodb = require('mongodb');
const fs = require('fs');

//connection URI to mongodb
const url = 'mongodb://192.168.100.7:27017';
// Database Name
const dbName = 'Trading';
// Create a new MongoClient
const client = new mongodb.MongoClient(url,{ useUnifiedTopology: true, useNewUrlParser: true } );
// Reading indeed.json - array with indeed company links
var contents = fs.readFileSync('indeed.json', 'utf8');
var urls = JSON.parse(contents);

/**
 * Returns html from url
 * @param {string} url - The url for fetching html content
 */
async function get(url)
{
    let response = request(url);
    return await response;
}

/**
 * Returns data from indeed website as object
 * @param {string} url - The url for fetching html content
 * @param {object} date - Date() object
 */
async function getData(url, date){
    var doc = {};
    let html = await get(url);
    const $ = cheerio.load(html);
    await $('a.cmp-CompactHeaderMenuItem-link')
        .each(function (idx, el) 
        {
        let text = $(el).text();
        for (item of ['Jobs','Reviews'])
            {
                if (text.includes(item))
                {
                    let value = text.replace(item,'');
                    if (value.includes('K'))
                        {
                            value = Number(value.replace('K','')) * 1000
                        }
                    else{
                        value = Number(value)
                        }
                    doc[item] = value
                }
            }
        })
    await $('table').first().find('tr')
        .each(function(idx,el)
        {
            let tds = $(el).find('td');
            let first = tds.first().text();
            let last = tds.last().text();
            doc[last] = Number(first);
        })
    doc['Date'] = date;
    doc['Source'] = url;
    if (html !== undefined){
        try{
        let split = html.split('"companyLinks":')[1].split(']')[0] +']';
        split = JSON.parse(split);
        if (split != undefined)
            {
            for (item of split)
                {
                    let link = item['href'];
                    var text = item['text'];
                    text = text.replace(/[.]/g,' ');
                    text = text.toLowerCase();
                    let names = ['website','instagram','facebook', 'twitter','youtube','linkedin']
                    for (name of names)
                        {
                            if (text.includes(name))
                                {
                                    let key = name.replace(/^\w/, c => c.toUpperCase());
                                    doc[key] = link;
                                    break;
                                }
                        }
                }
            }
        }
        catch(e){}
    }
    return doc;
}

/**
 * Insert arrays of object with data to MongoDB collection from indeed webpages, webpages are processed in batches
 * @param {string[]} urls - The urls for fetching html content.
 * @param {object} date - Date() object.
 * @param {number} [splitSize=50] - Size of chunks, last chunk could have smaller size.
 */
async function process(urls, splitSize=50)
{
    var date = new Date();
    await client.connect();
    var db = client.db(dbName);
    var coll = db.collection('Indeed');
    var result = splitArray(urls, splitSize);
    for (element of result)
        {
            let data = await Promise.all(
            element.map(async item =>{
            try{
                return await getData(item,date)
                }
            catch(e)
                {
                    return 'Error'
                }
            })
            );
        data = data.filter(doc => doc != 'Error');
        let d = new Date();
        console.log(d, `Batch with size ${splitSize} processed`);
        coll.insertMany(data);
        }
    client.close();
};

/**
 * Split array to arrays
 * @param {array} arr - array which will be used to generate arrays.
 * @param {number} splitSize - size of generated arrays.
 */
function splitArray(arr, splitSize){
    var results = [];
    
    while (arr.length) {
        results.push(arr.splice(0, splitSize));
    }
    
    return results;
}

process(urls)
