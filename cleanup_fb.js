if (!process.env.NODE_ENV){
  console.error('Specify an environment');
  process.exit();
} 

// Dependencies
var conf = require('./conf')
, ENV = process.env.NODE_ENV
, redis = require('redis')
, redis_client = redis.createClient(6379, conf.db[ENV].redis_host)
, doQuery = require('./lib/do_query.js')
, doDelete = require('./lib/do_delete.js')
, equipFields = require('./lib/equip_fields.js');


redis_client.keys('fbuser:*:info', function(e, keys){
  console.log(keys.length);
  /*keys.forEach(function(key){
    redis_client.del(key, function(e, r){
      if (!e && r){
        console.log('deleted', key);
      }else{
        console.log(e);
      }
    });
  });*/
});
