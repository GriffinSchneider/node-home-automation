
var path = require('path');
var http = require('http');

var models = require('./models.js');

/////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////
var makeHueAPIRequest = function (path, data, callbackWithBody) {
    var request = http.request({
        hostname: '192.168.1.125',
        port: '80',
        path: '/api/1234567890/' + path,
        method: 'PUT'
    }, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            callbackWithBody(body);
        });
    });

    request.write(JSON.stringify(data));
    
    request.on ('error', function(error) {
        console.log('error: ' + error.message);
    });
    
    request.end();
};

var sendLightStateRequest = function (lightState, lightId, callback) {
    var mapping = {
        isOn: "on",
        effect: "effect",
        brightness: "bri",
        saturation: "sat",
        hue: "hue",
        xy: "xy",
        transitionTime: "transitiontime"
    };
    
    var requestDict = {};
    
    for (var propertyName in lightState) {
        var propertyValue = lightState[propertyName];
        var mappedPropertyName = mapping[propertyName];
        if (mapping.hasOwnProperty(propertyName) && propertyValue && mappedPropertyName && propertyValue.length !== 0) {
            requestDict[mappedPropertyName] = propertyValue;
        }
    }
        
    makeHueAPIRequest('lights/'+ lightId + '/state', requestDict, function (body) {
        console.log(body);
        callback();
    });
};

var sendLightCommand = function(command) {
    // console.log(command.states);
    
    if (!command.states.length) {
        return;
    }
    
    // Making many requests at once seems to overwhelm the bridge,
    // so make the requests sequentially.
    var i = 0;
    var setLight = function () {
        var state = command.states[i];
        if (state) {
            setTimeout(function () {
                sendLightStateRequest(state, i+1, setLight);
                i++;
            }, 50);
        }
    };
    setLight();
};


/////////////////////////////////////////////////////
// Server
/////////////////////////////////////////////////////
var express = require('express');
var app = express();
app.use(express.bodyParser());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/commands', function (request, response) {
    models.LightCommand.find(function(err, found) {
        response.send(found.map(function(command){return{_id:command._id, name:command.name};}));
    });
});

app.post('/api/applyState', function(request, response){
    var body = request.body;
    models.LightCommand.findById(body._id, function(err, command) {
        sendLightCommand(command);
    });
});

var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});
