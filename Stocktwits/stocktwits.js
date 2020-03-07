const request = require('request-promise')
const mongodb = require('mongodb')

const url = 'mongodb://192.168.100.7:27017'
// Database Name
const dbName = 'Trading'
// Create a new MongoClient
const client = new mongodb.MongoClient(url)
const date = new Date()

async function getSentiment (symbol) {
  const url = 'https://stocktwits.com/symbol/' + symbol
  const response = await request(url)
  try {
    const sentiment = Number(response.split('"sentimentChange":')[1].split(',', 1)[0])
    return await sentiment
  } catch (e) { return '' }
}

async function process () {
  await client.connect()
  var db = client.db(dbName)
  const symbols = await db.collection('XTB_Stocks_CFD').distinct('Symbol')
  for (const symbol of symbols) {
    const sentiment = await getSentiment(symbol)
    if (sentiment !== '') {
      db.collection('Stocktwits').updateOne(
        { Date: date }, { $push: { Data: { Value: sentiment, Symbol: symbol } } },
        { upsert: true })
    }
  }
  client.close()
}

process()
