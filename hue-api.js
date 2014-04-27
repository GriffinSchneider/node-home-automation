var http = require('http');

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

    request.on('error', function (error) {
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

    makeHueAPIRequest('lights/' + lightId + '/state', requestDict, function (body) {
        console.log(body);
        callback();
    });
};

exports.sendLightCommand = function (command) {
    // console.log(command.states);

    if (!command.states.length) {
        return;
    }

    // Making many requests at once seems to overwhelm the bridge,
    // so make the requests sequentially.
    var i = 0;
    (function setLight () {
        var state = command.states[i];
        if (state) {
            setTimeout(function () {
                sendLightStateRequest(state, i + 1, setLight);
                i++;
            }, 50);
        }
    })();
};
