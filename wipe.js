if (!process.env.NODE_ENV){
  console.error('Specify an environment');
  process.exit();
} 

if (!process.argv[2]){
  console.error('usage : node wipe.js <user_nickname>');
  process.exit();
}

var USER_NICKNAME = process.argv[2];

// Dependencies
var conf = require('./conf')
, db = require('./lib/init_db')(conf.db) 
, ENV = process.env.NODE_ENV
, redis = require('redis')
, redis_client = redis.createClient(6379, conf.db[ENV].redis_host)
, doQuery = require('./lib/do_query.js')
, doDelete = require('./lib/do_delete.js')
, equipFields = require('./lib/equip_fields.js');

console.log('===================')
console.log('Welcome to ==WIPE==');
console.log('===================');
console.log('Commencing wipe of', USER_NICKNAME);
console.log('Connecting to mongo replica sets...');
console.log('...this will take about 15-20 seconds');
console.log('===================');

// Connect to DB 
db.open(function(e, db_client){

  if (e){
    console.error(e);
    process.exit();
  }

  console.log('db conected');

  function encodeId(id){
    try {
      return db_client.bson_serializer.ObjectID.createFromHexString(id);
    } catch (e){
      console.log(e);
      //res.sendError({code:401, msg:'Bad Object ID: '+e.message}); 
    }
  }

  var getUser = function(nickname, cb){
    var req = {};
    req.query_collection = 'users';
    req.query_options = {};
    //req.query_options.fields = equipFields(conf, req.query_collection);
    req.query_params = {
      nickname : nickname
    };
    doQuery(req, null, db_client, cb);
  };

  var getChannelIds = function(user_id, cb){
    var req = {};
    req.query_collection = 'channels';
    req.query_options = {};
    req.query_options.fields = equipFields(conf, req.query_collection);
    req.query_params = {
      user_id : user_id
    };
    var channelIds = [];
    doQuery(req, null, db_client, function(e, channels){
      channels.forEach(function(channel){
        channelIds.push(channel._id);
      });
      return cb(channelIds);
    });
  };

  var remChannelBcasts = function(channel_id, cb){
    var req = {};
    req.query_collection = 'broadcasts';
    req.query_params = {
      channel_id : channel_id
    }
    doDelete(req, null, db_client, cb);
  };

  var remUsrChannels = function(user_id, cb){
    var req = {};
    req.query_collection = 'channels';
    req.query_params = {
      //user_id : encodeId(user_id)
      user_id : user_id
    };
    doDelete(req, null, db_client, cb); 
  };

  var remUsr = function(user_id, cb){
    var req = {};
    req.query_collection = 'users';
    req.query_params = {
      _id : user_id
    };
    doDelete(req, null, db_client, cb);
  };
   
  var wipeUserMongo = function(user_id, callback){
    getChannelIds(user_id, function(chids){
      chids.forEach(function(chid){
        remChannelBcasts(chid, function(e, bwipes){
          console.log('wiped', bwipes, 'broadcasts');
          remUsrChannels(user_id, function(e, chwipes){
            console.log('wiped', chwipes, 'channels');
              remUsr(user_id, function(e, uwipes){
                console.log('wiped', uwipes, 'user');
                callback();
              });
          });    
        });
      });
    });
  };

  var authToRedisMap = {
    'twitter':'stream_users',
    'facebook':'fb_users',
    'tumblr':'tumblr_users'
  };


  var rAuthDel = function(auths, cb){
    if (!auths.length){
      return cb();  
    }
    var _auth = auths.shift();
    var redisSet = authToRedisMap[_auth.provider];
    redis_client.srem(redisSet, _auth.uid, function(){
      return rAuthDel(auths, cb);
    });
  };

  var wipeUserRedis = function(user_id, cb){
    getUser(user_id, function(e, user){
      if (!user.length){
        console.error("Wipe couldn't find", user_id);
        process.exit();
      }
      var auths = user[0].authentications;
      rAuthDel(auths, function(){
        cb(user[0]);
      });
    });
  };
  
  wipeUserRedis(USER_NICKNAME, function(user){
    console.log('redis wiped');
    wipeUserMongo(user._id, function(){
      console.error(user.nickname, 'wiped. Bye :-]');
      console.log('===================');
      process.exit();
    });
  });
});
