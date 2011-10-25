const ReplayExpiry = 86400;

var crypto = require('crypto'),
    qs = require('querystring'),
    url = require('url');


exports.OAuthError = function (res, message) {
	/*this.name = 'OAuthError';
	this.message = message;
	Error.captureStackTrace(this, exports.OAuthError);
  */
  return res.sendError({code:401, msg:message}); 
}
//exports.OAuthError.prototype = new Error;


exports.parseHeader = function () {
	return function (req, res, next) {
		// Patch aoauthParams objects into the request
		req.oauthParams = {};
		req.oauthHeaderParams = {};

		// Add oauth parameters from the query and body
		for (var key in req.query)
			if (key.match(/^oauth_/))
				req.oauthParams[key] = req.query[key];
		for (var key in req.body)
			if (key.match(/^oauth_/))
				req.oauthParams[key] = req.body[key];

		// Parse the Authorization header into it if given
		var hdr = req.header('Authorization');
		if (hdr && hdr.match(/^OAuth\b/i)) {
			var params = hdr.match(/[^=\s]+="[^"]*"(?:,\s*)?/g);
			for (var i = 0; i < params.length; i++) {
				var match = params[i].match(/([^=\s]+)="([^"]*)"/);
				var key = qs.unescape(match[1]);
				var value = qs.unescape(match[2]);
				req.oauthParams[key] = req.oauthHeaderParams[key] = value;
			}
		}
    next();
	};
};


function oauthBaseStringURI(req) {
	// Argh!
	var scheme = req.connection.verifyPeer != undefined ? 'https' : 'http';
	var hostname = req.header('host').split(':')[0].toLowerCase();
	var port = parseInt(req.header('host').split(':')[1], 10);
	
	if ((!isNaN(port)) && (scheme != 'http' || port != 80) && (scheme != 'https' || port != 443)){
	  hostname = hostname + ':' + port;
	}
	return scheme + "://" + hostname + url.parse(req.originalUrl).pathname;
}

function oauthRequestParameterString(req) {
	var params = [];
	
	// Add encoded counterparts of query string parameters
	for (var key in req.query)
		if (key != 'oauth_signature')
			params.push([ qs.escape(key), qs.escape(req.query[key]) ]);
			
	// Add encoded counterparts of OAuth header parameters
	for (var key in req.oauthHeaderParams)
		if (key.match(/^oauth_/)
		    && key != 'oauth_signature')
		    params.push([ qs.escape(key), qs.escape(req.oauthHeaderParams[key]) ]);
		    
	// Add encoded counterparts of body parameters
  if (req.is('application/x-www-form-urlencoded')){
    for (var key in req.body){
      if (key != 'oauth_signature'){
        if (req.headers['user-agent']=='Node authentication' || req.method=='POST'){
          //params.push([ qs.escape(key), qs.escape(req.body[key]) ]);
          params.push([ qs.escape(key), oAuthEscape(req.body[key]) ]);
        }  
      }
    }
  }

	params.sort();
	var paramString = "";
  
	for (var i = 0; i < params.length; i++) {
		paramString += (paramString ? '&' : '') + params[i][0] + '=' + params[i][1];
  }
	return paramString;
}

function oAuthEscape(r) {
  return encodeURIComponent(r).replace("!","%21","g").replace("*","%2A","g").replace("'","%27","g").replace("(","%28","g").replace(")","%29","g");
}

exports.verifySignature = function (lookup, redisClient) {
	return function (req, res, next) {
		// Make sure we're dealing with the right version
		if (req.oauthParams['oauth_version'] != undefined
		    && req.oauthParams['oauth_version'] != '1.0')
        return exports.OAuthError(res, "unsupported OAuth version: please use v1.0");
		    
		// Verify that the timestamp and nonce pair hasn't been used already
		var timestamp = parseInt(req.oauthParams['oauth_timestamp'], 10);
		var nonce = req.oauthParams['oauth_nonce'];
		if (!timestamp || !nonce)
			return exports.OAuthError(res, "missing OAuth timestamp or nonce");
		
		var replayCutoff = Math.floor(Date.now() / 1000) - ReplayExpiry;
		if (timestamp < replayCutoff)
			return exports.OAuthError(res, "OAuth request too old");			

		if (redisClient) {
			var replayKey = "OAuth " + timestamp + " " + nonce;
			redisClient.setnx(replayKey, "SEEN", function (err, redis_res) {
				if (redis_res == 0)
					return exports.OAuthError(res, "OAuth request has been used before");

				if (err)
					return exports.OAuthError(res, "Failed to validate OAuth nonce/timestamp " + err);
				else
					redisClient.expire(replayKey, ReplayExpiry);

				lookupTokens();
			});
		} else {
			lookupTokens();
		}
		
		var clientSecret, tokenSecret;
		function lookupTokens() {
			// Generate the key for signature generation
			var clientIdentifier = req.oauthParams['oauth_consumer_key'] || '';
			var tokenIdentifier = req.oauthParams['oauth_token'] || '';
			var abandon = false, clientSecretSet = false, tokenSecretSet = false;
			lookup(req, res, 'client', clientIdentifier, function (err, secret) {
        abandon = err;
				if (abandon) return;
				if (secret instanceof Error) {
					abandon = true;
					return next(secret);
				}
			
				clientSecret = secret;
				clientSecretSet = true;
				if (tokenSecretSet)
					verifySignature();

        lookup_token();
			});

			 var lookup_token = function(){
         lookup(req, res, 'token', tokenIdentifier, function (err, secret) {
          abandon = err;
          if (abandon) return;
          if (secret instanceof Error) {
            abandon = true;
            return next(secret);
          }
        
          tokenSecret = secret;
          tokenSecretSet = true;
          if (clientSecretSet)
            verifySignature();
         });
       };
		}
		function verifySignature() {
			if (!clientSecret && !tokenSecret)
				return exports.OAuthError(res, "unknown OAuth client or token");
		
			// Construct the base string for signature generation
			var baseStringURI = oauthBaseStringURI(req);
			var requestParameterString = oauthRequestParameterString(req);
			var baseString = req.method.toUpperCase() + "&" + qs.escape(baseStringURI) + "&" + qs.escape(requestParameterString);

			// Construct key from returned tokens		
			var key = qs.escape(clientSecret ? clientSecret : '') + '&' + qs.escape(tokenSecret ? tokenSecret : '');

      //URL-decoding oauth_signature_method
	    req.oauthParams['oauth_signature'] = unescape(req.oauthParams['oauth_signature']);

			// Verify the signature
			if (req.oauthParams['oauth_signature_method'] == 'PLAINTEXT') {
				if (req.oauthParams['oauth_signature'] != key)
          return exports.OAuthError(res, "Bad OAuth signature");

			} else if (req.oauthParams['oauth_signature_method'] == 'HMAC-SHA1') {
        //console.log('API-key:', key);
        //console.log('API-basestring:', baseString);
			  var hmac = crypto.createHmac('sha1', key).update(baseString).digest('base64');
        //console.log('API-hmac', hmac);
				if (req.oauthParams['oauth_signature'] != hmac)
					return exports.OAuthError(res, "failed OAuth HMAC-SHA1 verification");
	
			} else {
				return exports.OAuthError(res, "unsupported or missing OAuth signature method");
			}
			
			return next();
		}
	};
};

exports.verifyBody = function () {
	return function (req, res, next) {
		if (!req.oauthParams || !req.oauthParams['oauth_signature_method']){
      res.end('Unable to Authenticate: No oAuth Params or Signature Method');
      return;
			//return next();
    }

		// Verify the body hash if given
		if (req.oauthParams['oauth_body_hash'] != undefined
		    && req.oauthParams['oauth_signature_method'] != 'PLAINTEXT') {
			var hash = crypto.createHash('sha1');
			hash.update(req.rawBody ? req.rawBody : '');
			
			if (hash.digest('base64') != req.oauthParams['oauth_body_hash'])
				return exports.OAuthError(res, "failed OAuth body verification");
				
		} else if (req.rawBody && !req.is('application/x-www-form-urlencoded')) {
			return exports.OAuthError(res, "missing OAuth body digest");
		}
		
		next();
	};
};


exports.generateToken = function (length) {
	if (length == undefined)
		length = 24;

	var token = "";
	for (var i = 0; i < length; i++) {
		var byte = Math.floor(Math.random() * 62);
		if (byte < 26)
			token += String.fromCharCode('a'.charCodeAt(0) + byte);
		else if (byte < 52)
			token += String.fromCharCode('A'.charCodeAt(0) + byte - 26);
		else if (byte < 62)
			token += String.fromCharCode('0'.charCodeAt(0) + byte - 52);
		else
			token += '_';
	}
	return token;
}
