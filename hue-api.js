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

function sendLightStateRequest(stateId, lightNumber, callback) {
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

    models.LightState.findById(
        stateId
    ).then(function(lightState) {
        for (var propertyName in lightState) {
            var propertyValue = lightState[propertyName];
            var mappedPropertyName = mapping[propertyName];

            if (propertyName === 'isOn') {
                requestDict[mappedPropertyName] = propertyValue;
                continue;
            } else if (propertyName === 'xy') {
                if (propertyValue.length) {
                    requestDict[mappedPropertyName] = propertyValue;
                }
            } else if (mappedPropertyName && propertyValue) {
                requestDict[mappedPropertyName] = propertyValue;
            }
        }

        makeHueAPIRequest('lights/' + lightNumber + '/state', requestDict, function (body) {
            console.log(body);
            callback();
        });
    }).done();
};

exports.sendLightCommand = function (command) {

    if (!command.statesForLights.length) {
        return;
    }

    var statesForLights = command.statesForLights;

    var lightsToChange = [];
    for (var lightNumber in statesForLights) {
        if (!isNaN(lightNumber) && statesForLights[lightNumber]) {
            lightsToChange.push({lightNumber: lightNumber,
                                 stateId: statesForLights[lightNumber]});
        }
    }

    // Making many requests at once seems to overwhelm the bridge,
    // so make the requests sequentially.
    var i = 0;
    (function setLight () {
        var stateAndLight = lightsToChange[i];
        if (stateAndLight) {
            setTimeout(function () {
                sendLightStateRequest(stateAndLight.stateId, stateAndLight.lightNumber, setLight);
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

