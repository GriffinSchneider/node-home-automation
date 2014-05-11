var path = require('path');
var express = require('express');
var http = require('http');

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
    models.LightCommand.find(function(err, found) {
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
    });
});

app.get('/createState', function(request, response) {
    response.render('main', {
        partials: {page: 'createState'} 
    });
});

app.get('/createCommand', function(request, response) {
    models.LightState.find(function(err, found) {
        var states = found.map(function(state) {
            return {
                _id: state._id,
                name: state.name
            };
        });
        var lightArray = [];
        for (var lightNumber in api.lights) {
            if (api.lights.hasOwnProperty(lightNumber)) {
                lightArray[lightNumber - 1] = api.lights[lightNumber];
            }
        }
        console.log(lightArray);
        response.render('main', {
            partials: {page: 'createCommand'},
            lightStates: states,
            lights: lightArray
        });
    });
});

app.post('/api/createState', function(request, response) {

    var state = new models.LightState();
    
    for (var param in request.body) {
        if (request.body.hasOwnProperty(param)) {
            var value = request.body[param];
            if (param === 'isOn' && value === 'off') {
                value = false;
            }
            state[param] = value;
        }
    }
    state.save();
    
    console.log(state);
    
    response.redirect("/");
});

app.post('/api/createCommand', function(request, response) {
    var body = request.body;

    var command = new models.LightCommand();
    command.statesWithLights = [];
    command.name = body.name; 
    
    for (var lightNumber in body) {
        if (body.hasOwnProperty(lightNumber) && !isNaN(lightNumber)) {
            var stateId = body[lightNumber];
            if (stateId !== 'none') {
                command.statesWithLights.push(
                    {lightNumber: lightNumber + 1,
                     lightStateId: body[lightNumber]});
            }
        }
    }
    
    command.save();
    
    console.log(request.body);
    console.log(command);
    
    response.redirect("/");
});
    
app.get('/api/sendCommand/:commandId', function(request, response){
    var body = request.body;
    models.LightCommand.findById(request.param('commandId'), function(err, command) {
        api.sendLightCommand(command);
    });
    response.send();
});

var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});

api.getLightState();
require('reload')(server, app, 700);
