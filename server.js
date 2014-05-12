var path = require('path');
var express = require('express');
var mongoose = require('mongoose-q')();
var Q = require('q');

var models = require('./models.js');
var api = require('./hue-api.js');

var app = express();
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

var consolidate = require('consolidate');
app.engine('html', consolidate.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');


app.get('/', function(request, response) {
    models.LightCommand.findQ(
        {}
    ).then(function (found) {
        var commands = found.map(function(command) {
            return {
                _id: command._id,
                name: command.name
            };
        });
        response.render('main', {
            partials: {page: 'chooseCommand'},
            lightCommands: commands
        });
    }).done();
});

app.get('/editState/:stateId?', function(request, response) {
    models.LightState.findById(
        request.param('stateId')
    ).then (function(lightState) {
        var renderDict = {
            partials: {page: 'createState'}
        };
        for (var prop in lightState) {
            renderDict[prop] = lightState[prop];
        }
        response.render('main', renderDict);
    }).done();
});

app.get('/editCommand/:commandId?', function(request, response) {
    // Find the command we're trying to edit
    Q.all([
        models.LightCommand.findById(request.param('commandId')),
        models.LightState.findQ()
    ]).spread(function(lightCommand, found) {
        var allStates = found.map(function(state) {
            return {
                _id: state._id,
                name: state.name
            };
        });

        var lightAndStateArray = [];
        var storedStatesWithLights = lightCommand ? lightCommand.statesWithLights : [];
        
        // Loop through all the lights
        for (var lightNumber in api.lights) {
            
            var lightAndState = {light: api.lights[lightNumber],
                               states:[]};

            // Loop through all the states
            for (var stateIndex in allStates) {
                // For each state, make a copy of it that we can modify
                var stateForLight = {
                    _id: allStates[stateIndex]._id,
                    name: allStates[stateIndex].name,
                    selected: false
                };

                var storedStateIdForLight = lightCommand? lightCommand.statesForLights[lightNumber] : null;
                
                if (storedStateIdForLight && stateForLight._id.equals(storedStateIdForLight)) {
                    stateForLight.selected = true;
                }
                
                lightAndState.states.push(stateForLight);
            }
            
            lightAndStateArray[lightNumber - 1] = lightAndState;
        }
        
        response.render('main', {
            partials: {page: 'createCommand'},
            lightsAndStates: lightAndStateArray,
            lightCommand: lightCommand
        });
        
    }).done();
});

app.post('/api/editState/:stateId?', function(request, response) {
    models.LightState.findById(
        request.param('stateId')
        
    ).then(function(lightState) {
        if (!lightState) {
            lightState = new models.LightState();
        }
        
        for (var param in request.body) {
            if (request.body.hasOwnProperty(param)) {
                var value = request.body[param];
                if (param === 'isOn' && value === 'off') {
                    value = false;
                }
                lightState[param] = value;
            }
        }
        lightState.save();
        
        response.redirect("/");
        
    }).done();
});

app.post('/api/editCommand/:commandId?', function(request, response) {
    models.LightCommand.findById(
        request.param('commandId')
        
    ).then(function(command) {
        var body = request.body;

        if (!command) {
            command = new models.LightCommand();
            command.statesForLights = [];
        }
        
        command.name = body.name; 
        
        for (var lightNumber in body) {
            if (!isNaN(lightNumber)) {
                var stateId = body[lightNumber];
                if (stateId !== 'none') {
                    command.statesForLights.set(parseInt(lightNumber) + 1, body[lightNumber]);
                }
            }
        }
        
        command.save();
        
        response.redirect("/");
        
    }).done();
});
    
app.get('/api/sendCommand/:commandId', function(request, response){
    models.LightCommand.findById(request.param('commandId')).then(function(command) {
        api.sendLightCommand(command);
    }).done();
    response.send();
});

var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});

api.getLightState();
require('reload')(server, app, 700);
