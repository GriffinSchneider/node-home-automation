var path = require('path');
var express = require('express');
var mongoose = require('mongoose-q')();
var Q = require('q');
var _ = require('underscore');

var models = require('./models.js');
var api = require('./hue-api.js');

var app = express();
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

var consolidate = require('consolidate');
app.engine('html', consolidate.handlebars);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');


function buttonGrid(model, editUrl, shouldFollowLinks, request, response) {
    model.findQ(
        {}
    ).then (function(allStuff) {
        response.render('main', {
            partials: {page: 'buttonGrid'},
            buttons: _.map(allStuff, _.partial(_.pick, _, '_id', 'name')),
            buttonUrl: editUrl,
            shouldFollowLinks: shouldFollowLinks
        });
    }).done();
}

app.get('/', _.partial(buttonGrid, models.LightCommand, false, '/api/sendCommand'));

///////////////////////////////
// States
///////////////////////////////
app.get('/editStates', _.partial(buttonGrid, models.LightState, true, '/editState/'));

app.get('/editState/:stateId?', function(request, response) {
    models.LightState.findById(
        request.param('stateId')
    ).then (function(lightState) {
        var renderDict = _.clone(lightState) || {};
        renderDict.partials = {page: 'editState'};
        response.render('main', renderDict);
    }).done();
});

app.post('/api/editState/:stateId?', function(request, response) {
    models.LightState.findById(
        request.param('stateId')
    ).then(function(lightState) {
        lightState = lightState || new models.LightState();
        _.extend(lightState, _.omit(request.body, 'isOn'));
        lightState.isOn = request.body['isOn'] === 'on';
        lightState.save();
        console.log("\nSaved State:\n", lightState);
        response.redirect("/");
    }).done();
});

///////////////////////////////
// Commands
///////////////////////////////
app.get('/editCommands', _.partial(buttonGrid, models.LightCommand, true, '/editCommand/'));

app.get('/editCommand/:commandId?', function(request, response) {
    Q.all([
        models.LightCommand.findById(request.param('commandId')),
        models.LightState.findQ()
    ]).spread(function(lightCommand, allStates) {

        var lightAndStateArray = _.map(api.lights, function (light, lightNumber) {
            var states = _.map(allStates, function(state, stateIndex) {
                var storedStateIdForLight = lightCommand ? lightCommand.statesForLights[lightNumber] : null;
                var isSelected = storedStateIdForLight && state._id.equals(storedStateIdForLight);
                return {
                    _id: state._id,
                    name: state.name,
                    selected: isSelected
                };
            });
            return {
                light: light,
                states: states
            };
        });

        response.render('main', {
            partials: {page: 'editCommand'},
            lightsAndStates: lightAndStateArray,
            lightCommand: lightCommand
        });
        
    }).done();
});

app.post('/api/editCommand/:commandId?', function(request, response) {
    models.LightCommand.findById(
        request.param('commandId')
        
    ).then(function(command) {
        var body = request.body;
        command = command || new models.LightCommand();
        command.name = body.name; 

        _.each(body, function(stateId, lightId) {
            var lightNumber = parseInt(lightId);
            if (lightNumber && stateId !== 'none') {
                command.statesForLights.set(lightNumber + 1, stateId);
            }
        });
        
        command.save();
        console.log("\nSaved Command:\n", command);
        
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
