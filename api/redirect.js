
const urlChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lastCharIndex = urlChars.length - 1;

var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;

function findExistingUrl(db, shortUrl, callback) {
  db.collection("urls", function(err, collection)
  {
    collection.findOne({ "shortUrl": shortUrl }, function(err, existing)
    {
      callback(err, existing);
    });
  });
}

module.exports = function(url, callback) {
  mongoClient.connect(process.env.DB_URL, function (err, db) {
    if (err) {
      callback({ "error": err });
    } else {
      findExistingUrl(db, url, function(err, existing) {
        if (existing) {
          callback({ "originalUrl": existing.originalUrl, "shortUrl": existing.shortUrl });
          db.close();
        } else {
          callback({ "error": 'unknown short URL', "shortUrl": url });
        }
      });
    }  
  });
}


