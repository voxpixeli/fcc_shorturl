
const urlChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lastCharIndex = urlChars.length - 1;

var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;


function nextChar(char) {
  var i = urlChars.indexOf(char);
  if (i === lastCharIndex){
    return 0;
  } else {
    return urlChars[i+1];
  }
}

function generateNextShortUrl(lastGenUrl, tail) {
  var next = "";
  var char = nextChar(lastGenUrl[lastGenUrl.length-1]);
  if (char==urlChars[0]) {
    if (lastGenUrl.length==1) {
      return urlChars[1] + char + tail;
    } else {
      return generateNextShortUrl(lastGenUrl.substr(0, lastGenUrl.length-1), char + tail);
    }
  } else {
    return lastGenUrl.substr(0, lastGenUrl.length-1) + char + tail;
  }
}

function getConfig(db, callback) {
  db.collection("config", function(err, collection)
  {
    collection.findOne({}, function(err, config)
    {       
      callback(err, config);
    });
  });
}

function findExistingUrl(db, originalUrl, callback) {
  db.collection("urls", function(err, collection)
  {
    collection.findOne({ "originalUrl": originalUrl }, function(err, existing)
    {
      callback(err, existing);
    });
  });
}


module.exports = function(arg, callback) {
  var original="";
  mongoClient.connect(process.env.DB_URL, function (err, db) {
    
    if (err) {
      callback({ "error": err });
    } else {
      original = arg;
      
      if (!/^(http|https):\/\/[^ "]+$/.test(original)) {
        callback({ "error": 'invalid URL', "originalUrl": original });
      } else {
        
        var lastGenUrl = "";  // last generated short url
        var nextGenUrl = "";  // newly generated short url

        console.log('original', original);
        
        findExistingUrl(db, original, function(err, existing) {
          if (existing) {
              
              console.log('existing', existing.shortUrl);
            
              callback({ "originalUrl": original, "shortUrl": existing.shortUrl });

              db.close();
            
          } else {

            getConfig(db, function(err, config) {

              // retrieve last generated short url
              if(config==null) {
                lastGenUrl = "H7b";  // counter start, just not to be zero...
                db.collection("config").insertOne({ "lastGenUrl": lastGenUrl });            
              } else {
                lastGenUrl = config.lastGenUrl;
              }

              // generate next short url
              nextGenUrl = generateNextShortUrl(lastGenUrl, "");

              console.log('lastGenUrl, nextGenUrl', lastGenUrl, nextGenUrl);

              // update config in db

              db.collection("config").updateOne({}, { "lastGenUrl": nextGenUrl });

              // create url in db

              db.collection("urls").insertOne({ "originalUrl": original, "shortUrl": nextGenUrl });

              callback({ "originalUrl": original, "shortUrl": nextGenUrl });

              db.close();
              
            });
            
          }
          
        });
            
            
      }
    }
  });
}

