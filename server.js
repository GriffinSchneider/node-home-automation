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

function buttonGrid(model, buttonUrl, shouldFollowLinks, request, response) {
    model.aggregateQ([
        {$group : {
            _id : "$groupName",
            buttons: {
                $push: {_id: "$_id", name: "$name", indexInGroup: "$indexInGroup"}
            }
        }}
    ]).then (function(allStuff) {
        var sortedStuff = _.map(_.sortBy(allStuff, '_id'), function(group, groupIndex) {
            return {
                _id: group._id,
                buttons: _.sortBy(group.buttons, 'indexInGroup')
            };
        });
        response.render('main', {
            partials: {page: 'buttonGrid'},
            sections: sortedStuff,
            buttonUrl: buttonUrl,
            shouldFollowLinks: shouldFollowLinks
        });
    }).done();
}

app.get('/', function (request, response) {
    buttonGrid(models.LightCommand, '/api/sendCommand/', false, request, response);
});

///////////////////////////////
// States
///////////////////////////////
app.get('/editStates', function(request, response) {
    buttonGrid(models.LightState, '/editState/', true, request, response);
});

app.get('/editState/:stateId?', function(request, response) {
    models.LightState.findById(
        request.param('stateId')
    ).then (function(lightState) {
        var renderDict = _.clone(lightState) || {};
        renderDict.partials = {page: 'editState'};
        response.render('main', renderDict);
    }).done();
});

app.get('/deleteState/:stateId', function(request, response) {
    models.LightState.removeById(request.param('stateId'));
    response.redirect('/');
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
app.get('/editCommands', function(request, response) {
    buttonGrid(models.LightCommand, '/editCommand/', true, request, response);
});

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

app.get('/deleteCommand/:commandId', function(request, response) {
    models.LightCommand.findById(request.param('commandId')).then (function(command) {
        console.log("Deleting commnad:\n", command);
        models.LightCommand.removeById(request.param('commandId'));
        response.redirect('/');
    });
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
            if (!isNaN(lightNumber) && stateId !== 'none') {
                command.statesForLights.set(lightNumber + 1, stateId);
            }
        });
        
        command.save();
        console.log("\nSaved Command:\n", command);
        
        response.redirect("/");
        
    }).done();
});

app.post('/api/setCommandOrder/:groupId', function(request, response) {
    _.map(request.body.order, function(commandId, commandIndex) {
        models.LightCommand.findById(commandId).then(function (command) {
            if (command) {
                command.groupName = request.param('groupId');
                command.indexInGroup = commandIndex;
                command.save();
                console.log("\nSaved Command:\n", command);
            }
        }).done();
        response.send();
    });
});

app.get('/api/sendCommand/:commandId', function(request, response){
    models.LightCommand.findById(
        request.param('commandId')
    ).then(function(command) {
        console.log('\nSending command:\n', command);
        api.sendLightCommand(command);
    }).done();
    response.send();
});


var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});

api.getLightState();
require('reload')(server, app, 700);
