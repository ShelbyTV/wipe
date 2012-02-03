//Dependencies
var mongoStack = require('mongodb'),
Server = mongoStack.Server,
Db = mongoStack.Db,
ReplSetServers = mongoStack.ReplSetServers;
var env = process.env.NODE_ENV;

module.exports = function(db_conf){
  var db;

  switch (env){
    case 'development':
      db = new Db(db_conf.development.db_name, new Server(db_conf.development.host, db_conf.development.port, {auto_reconnect:true}), {native_parser:false});
    break;

    case 'production':
      var replServers = [];
      replServers[0] = new Server(db_conf.production.hosts[0], parseInt(db_conf.production.ports[0]), {auto_reconnect:true})
      replServers[1] = new Server(db_conf.production.hosts[1], parseInt(db_conf.production.ports[1]), {auto_reconnect:true})
      var replStat = new ReplSetServers(replServers, {read_secondary:true});
      db = new Db(db_conf.production.db_name, replStat, {native_parser:false});
    break;

    case undefined:
      console.log('please define NODE_ENV');
      process.exit();
    break;
  }

  return db;
};
