var conf = require('../conf')
, oauth_verifier = require('./node-express-oauth')
, redisClient = require('redis').createClient();

module.exports = function(DB_CLIENT, req, res, next){ 
  
  /*
   * This is really shitty - but will have to stay this way until I 
   * find/write a better oauth provider module for node...
   */
  oauth_verifier.parseHeader()(req, res, function(){
    oauth_verifier.verifyBody()(req, res, function(){
      oauth_verifier.verifySignature(function(req, res, type, identifier, callback){

        var query = function(coll, params, _fields, cb){
          var opts = {limit:1, fields:_fields};
          DB_CLIENT.collection(coll, function(e, coll){
            coll.find(params, opts).toArray(function(e, docs){
              cb(e, docs);
            });
          });    
        };
        
        if (type==='client'){ //aka consumer secret
          query('client_applications', {key:req.oauthParams.oauth_consumer_key}, ['secret'], function(e, docs){
            if (e || !docs || docs.length!==1){
              callback(true);
              return res.sendError({code:401, msg:'Bad consumer credentials'});      
            } 
            callback(null, docs[0].secret);
          });
        }

        if (type==='token'){
          query('oauth_tokens', {"token":req.oauthParams.oauth_token}, ['secret','user_id'], function(e, docs){
            if (e || !docs || docs.length!==1){
              callback(true);
              return res.sendError({code:401, msg:'Bad OAuth token'});      
            }
            req.authed_user = docs[0].user_id; 
            callback(null, docs[0].secret);
          });
        }

      }, redisClient)(req, res, next);
    });
  });

};
