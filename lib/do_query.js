var res_to_uid_map = {
  'broadcasts':'user_id',
  'channels':'user_id',
  'users':'_id'
};

var filterOwnedDocs = function(req, res, docs){
  var ownedDocs = [];
  docs.forEach(function(doc){
    var a = doc[res_to_uid_map[req.query_collection]].toString();
    var b = req.authed_user.toString();
    if (a===b){
      ownedDocs.push(doc);
    }
  });
  return ownedDocs;
};

module.exports = function(req, res, db, cb){
  db.collection(req.query_collection, function(e, coll){
    coll.find(req.query_params, req.query_options, function(e, cursor){
      cursor.toArray(function(e, docs){
        cb(e, docs);
      });
    });
  });    
};
