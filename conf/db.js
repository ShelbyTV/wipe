exports.development = {
  host : 'localhost',
  port : 27017,
  db_name : 'nos-staging',
  redis_host : '127.0.0.1'
};

exports.production = {
  hosts : ['10.181.135.130', '10.180.131.101'],
  ports : ['27018', '27018'],
  db_name : 'nos-production',
  redis_host : '10.180.173.25'
};
