/*
 * Do Delete
 */

module.exports = function(req, res, db, cb){
  db.collection(req.query_collection, function(e, coll){
    coll.remove(req.query_params, {safe:true}, cb);
  });    
};
