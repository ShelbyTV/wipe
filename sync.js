if (!process.env.NODE_ENV){
  console.error('Specify an environment');
  console.error('export NODE_ENV=production || export NODE_ENV=development');
  process.exit();
} 

/*var SERVICE = process.argv[2];

if (!SERVICE || SERVICE!=='twitter' || SERVICE!=='facebook'){
  console.error('Usage : node sync.js $service');
  console.error('$service can be one of twitter or facebook');
  process.exit();
}*/

// Dependencies
var conf = require('./conf')
, db = require('./lib/init_db')(conf.db) 
, ENV = process.env.NODE_ENV
, redis = require('redis')
, redis_client = redis.createClient(6379, conf.db[ENV].redis_host)
, doQuery = require('./lib/do_query.js')
, doBigFind = require('./lib/do_big_find.js')
, doDelete = require('./lib/do_delete.js')
, equipFields = require('./lib/equip_fields.js');

console.log('Recovering facebook ids -> redis set');
console.log('Connecting to Mongo');

// Connect to DB 
db.open(function(e, db_client){

  if (e){
    console.error(e);
    process.exit();
  }

  var getUsers = function(cb){
    var req = {};
    req.query_collection = 'users';
    req.query_options = {limit:100};
    req.query_options.fields = equipFields(conf, req.query_collection);
    req.query_params = {};
    doBigFind(req, null, db_client, cb);
  };

  var setMap = {
    'twitter':'stream_users',
    'facebook':'fb_users'
  };

  var infoKeyPrefixMap = {
    'facebook':'fbusr'
  };

  var getSetKey = function(service){
    return setMap[service];
  };

  var getInfoKey = function(uid, service){
    return infoKeyPrefixMap[service]+':'+uid+':info'
  }

  var addToRedisSet = function(key, uid){
    redis_client.sadd(key, uid, function(e, r){
      if (r && !e){
        console.log('added', uid, 'to', key);
      }
    });
  };

  var remFromFbSet = function(uid){
    //just added all twitter users to fb set
    redis_client.srem('fb_users', uid, function(e, r){
      if(r && !e){
        console.log('removed', uid);
      }
    });
  };

  var addInfoToFbSet = function(auth){
    redis_client.hset('fbusr:'+auth.uid+':info', 'access_token', auth.oauth_token, function(e, r){
      if(!e && r) {console.log('added token for', auth.uid)} 
    });
  };
  
  getUsers(function(data){
    data.forEach(function(user){
      if(user.authentications){
        user.authentications.forEach(function(auth){
          if (auth.provider==='facebook'){
            addInfoToFbSet(auth);
          } else if (auth.provider==='twitter'){
            addToRedisSet('stream_users', auth.uid);
          }
        });
      }
    });
  });

});
