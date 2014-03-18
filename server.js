
var path = require('path');
var http = require('http');

/////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////
function makeHueAPIRequest(path, data, callbackWithBody) {
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
}


/////////////////////////////////////////////////////
// DB Stuff
/////////////////////////////////////////////////////
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
});

/////////////////////
// Light State
/////////////////////
var lightStateSchema = mongoose.Schema ({
    name: String,
    isOn: Boolean,
    effect: String,
    brightness: Number,
    saturation: Number,
    hue: Number,
    xy: [Number],
    transitionTime: Number
});
var mapping = {
    isOn: "on",
    effect: "effect",
    brightness: "bri",
    saturation: "sat",
    hue: "hue",
    xy: "xy",
    transitionTime: "transitiontime"
};

lightStateSchema.methods.sendRequest = function (lightId, callback) {
    var requestDict = {};
    
    for (var propertyName in this) {
        var propertyValue = this[propertyName];
        var mappedPropertyName = mapping[propertyName];
        if (propertyValue && mappedPropertyName) {
            requestDict[mappedPropertyName] = propertyValue;
        }
    }
        
    makeHueAPIRequest('lights/'+ lightId + '/state', requestDict, function (body) {
        console.log(body);
        callback();
    });
};
var LightState = mongoose.model('LightState', lightStateSchema);

/////////////////////
// Command
/////////////////////
var lightCommandSchema = mongoose.Schema({
    name: String,
    states: [lightStateSchema]
});

lightCommandSchema.methods.send = function () {
    console.log(this.states);
    
    if (!this.states.length) {
        return;
    }
    
    // Making many requests at once seems to overwhelm the bridge,
    // so make the requests sequentially.
    var i = 0;
    var that = this;
    var setLight = function () {
        var state = that.states[i];
        if (state) {
            state.sendRequest(i+1, setLight);
            i++;
        }
    };
    setLight();
};

var LightCommand = mongoose.model('LightCommand', lightCommandSchema);

var testing = true;
if (testing) {
    LightCommand.collection.drop();
    LightState.collection.drop();
    
    var blueState = new LightState();
    blueState.name = "Blue";
    blueState.isOn = true;
    blueState.effect = 'none';
    blueState.bri = 255;
    blueState.sat = 255;
    blueState.hue = 43991;
    blueState.transitionTime = 50;
    blueState.save();
    
    var  = new LightCommand();
    testCommand.name = "Test Light Command";
    
    
    testCommand.states = [testState, testState, testState, testState, testState, testState, testState, testState, testState, testState];
    testCommand.save();
}

/////////////////////////////////////////////////////
// Server
/////////////////////////////////////////////////////
var express = require('express');
var app = express();
app.use(express.bodyParser());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/commands', function (request, response) {
    LightCommand.find(function(err, found) {
        response.send(found.map(function(command){return{_id:command._id, name:command.name};}));
    });
});

app.post('/api/applyState', function(request, response){
    var body = request.body;
    LightCommand.findById(body._id, function(err, command) {
        console.log(command);
        command.send();
    });
});

var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});
