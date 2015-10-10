module.exports = SteamStatus;

var request = require('request');

require('util').inherits(SteamStatus, require('events').EventEmitter);

function SteamStatus(options) {
	options = options || {};

	this._pollTimer = null;
	this._lastPoll = 0;
	this.pollInterval = options.pollInterval || 30000;
	this.timeToUpdate = options.timeToUpdate || 0;
	this.replaceNames = options.replaceNames || false;
	this.pollData = {};

	this.doPoll();

}

SteamStatus.prototype.getServerStatuses = function(callback) {
	var options = {
		url: 'https://crowbar.steamdb.info/Barney',
		headers: {
			'User-Agent': 'request',
		}
	};
	
	request(options, function(err, response, body) {
		if(err || response.statusCode != 200) {
			callback(err || new Error('HTTP error ' + response.statusCode));
			return;
		}
		
		body = JSON.parse(body);
		
		if(!body.success) {
			callback(err || new Error('Something wrong. Request wasn\'t success'))
		}

		callback(null, body);
	});
}

SteamStatus.prototype.doPoll = function() {
	if(Date.now() - this._lastPoll < 10000) {
		this._resetPollTimer(Date.now() - this._lastPoll);
		return;
	}
	
	this._lastPoll = Date.now();
	clearTimeout(this._pollTimer);

	this.getServerStatuses(function(err, response) {
		if(err) {
			this.emit('debug', 'Error getting statuses for poll: ' + err.message);
			this.emit('pollFailure', err);
			this._resetPollTimer();
			return;
		}
		
		var servers = response.services;
		var serversOld = this.pollData.servers || {};
		
		for(var name in servers) {
			var server = servers[name];
			var timeNow = Date.now();
			server.name = name;
			if(this.replaceNames) {
				server.status = server.status.replace('minor', 'slow');
				server.status = server.status.replace('major', 'offline');
			}
			var serverOld = serversOld[name];
			if(serverOld) {
				if(server.status != serverOld.status) {
					server.lastUpdate = timeNow;
				} else {
					server.lastUpdate = serverOld.lastUpdate;
				}
				var timeDiff = timeNow - serverOld.lastUpdate;
				if(server.status != serverOld.status && timeDiff >= this.timeToUpdate) {
					this.emit('statusChanged', server, serverOld);
					this.emit('statusChanged#' + name, server, serverOld);
					this.emit('statusChanged#' + server.status, server, serverOld);
				}
			} else {
				server.lastUpdate = timeNow;
			}
			serversOld[name] = server;
		}
		
		this.pollData.servers = serversOld;
		this.pollData.since = response.time;
		
		this.emit('pollSuccess');
		
		this._resetPollTimer();
	}.bind(this));
};

SteamStatus.prototype._resetPollTimer = function(time) {
	if(time || this.pollInterval >= 30000) {
		clearTimeout(this._pollTimer);
		this._pollTimer = setTimeout(this.doPoll.bind(this), time || this.pollInterval);
	}
};
