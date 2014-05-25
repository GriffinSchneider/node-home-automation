var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/home_automation');

var Schema = mongoose.Scheme;

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

var LightState = mongoose.model('LightState', lightStateSchema);
exports.LightState = LightState;

LightState.findById = function(objectId) {
    return LightState.findOneQ({_id:mongoose.Types.ObjectId(objectId ? (''+objectId) : null)});
};
LightState.removeById = function(objectId) {
    return LightState.removeQ({_id:mongoose.Types.ObjectId(objectId ? (''+objectId) : null)});
};

/////////////////////
// Command
/////////////////////
var lightCommandSchema = mongoose.Schema({
    name: String,
    groupName: String,
    indexInGroup: Number,
    statesForLights: [mongoose.Schema.Types.ObjectId]
});

var LightCommand = mongoose.model('LightCommand', lightCommandSchema);
exports.LightCommand = LightCommand;

LightCommand.findById = function(objectId) {
    return LightCommand.findOneQ({_id:mongoose.Types.ObjectId(objectId ? (''+objectId) : null)});
};
LightCommand.removeById = function(objectId) {
    return LightCommand.removeQ({_id:mongoose.Types.ObjectId(objectId ? (''+objectId) : null)});
};
