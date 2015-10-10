var SteamStatus = require('../lib/index.js'); // use require('steam-status') in production

var status = new SteamStatus({
	pollInterval: 30000,
});

// status change for all servers
status.on('statusChanged', function(server, oldServer) {
	console.log('Status changed for server ' + server.name + ' from ' + oldServer.status + ' to ' + server.status);
});

// status change to 'minor' status
status.on('statusChanged#minor', function(server, oldServer) {
	console.log('Changeg to minor status for ' + server.name + ' from ' + oldServer.status + ' to ' + server.status);
});

// status change for 'community' server
status.on('statusChanged#community', function(server, oldServer) {
	console.log('Community server changed it status from ' + oldServer.status + ' to ' + server.status);
});

status.on('pollFailure', function(err) {
	console.log(err);
});

status.on('pollSuccess', function() {
	// success polling
});

status.on('debug', function(mes) {
	console.log(JSON.stringify(mes));
});