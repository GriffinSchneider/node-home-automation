var http = require('http');
var models = require('./models.js');

function makeHueAPIRequest(path, data, callbackWithBody) {
    var request = http.request({
        hostname: '192.168.1.125',
        port: '80',
        path: '/api/1234567890/' + path,
        method: data ? 'PUT' : 'GET'
    }, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            callbackWithBody(JSON.parse(body));
        });
    });

    request.write(JSON.stringify(data));

    request.on('error', function (error) {
        console.log('error: ' + error.message);
    });

    request.end();
};

function sendLightStateRequest(stateAndLight, callback) {
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

    models.LightState.findOne({_id:stateAndLight.lightStateId}, function(err, lightState) {
        for (var propertyName in lightState) {
            var propertyValue = lightState[propertyName];
            var mappedPropertyName = mapping[propertyName];
            if (mapping.hasOwnProperty(propertyName) && propertyValue && mappedPropertyName && propertyValue.length !== 0) {
                requestDict[mappedPropertyName] = propertyValue;
            }
        }

        makeHueAPIRequest('lights/' + stateAndLight.lightNumber + '/state', requestDict, function (body) {
            console.log(body);
            callback();
        });
    });
};

exports.sendLightCommand = function (command) {

    if (!command.statesWithLights.length) {
        return;
    }

    // Making many requests at once seems to overwhelm the bridge,
    // so make the requests sequentially.
    var i = 0;
    (function setLight () {
        var stateAndLight = command.statesWithLights[i];
        if (stateAndLight) {
            setTimeout(function () {
                sendLightStateRequest(stateAndLight, setLight);
                i++;
            }, 50);
        }
    })();
};


exports.getLightState = function() {
    makeHueAPIRequest('lights', null, function(body) {
        exports.lights = body;
    });
};

