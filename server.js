
var path = require('path');
var express = require('express');

var models = require('./models.js');
var api = require('./hue-api.js');

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
        api.sendLightCommand(command);
    });
});

var server = app.listen (3000, function () {
    console.log('Listening on port %d', server.address().port);
});
