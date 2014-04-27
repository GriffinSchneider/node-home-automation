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
        var states = found.map(function(command) {
            return {
                _id: command._id,
                name: command.name
            };
        });
        response.render('index', {
            lightStates: states
        });
    });
});

app.get('/api/applyState/:stateId', function(request, response){
    var body = request.body;
    models.LightCommand.findById(request.param('stateId'), function(err, command) {
        api.sendLightCommand(command);
    });
    response.send();
});

var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});

require('reload')(server, app, 700);
