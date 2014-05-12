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

/////////////////////
// Command
/////////////////////
var lightCommandSchema = mongoose.Schema({
    name: String,
    statesForLights: [mongoose.Schema.Types.ObjectId]
});

var LightCommand = mongoose.model('LightCommand', lightCommandSchema);
exports.LightCommand = LightCommand;

/////////////////////
// Convenience
/////////////////////
exports.objectId = function (objectIdString) {
    return mongoose.Types.ObjectId(objectIdString);
};


/////////////////////
// Test Data
/////////////////////
var testing = true;
if (testing) {
    LightCommand.collection.drop();
    LightState.collection.drop();
    for (i = 0; i < 100; i++) {
        var state = new LightState();
        state.name = "Blue";
        state.isOn = true;
        state.effect = 'none';
        state.brightness = 255;
        state.saturation = 255;
        state.hue = 600 * i;
        state.transitionTime = 5;
        state.save();
        
        var testCommand = new LightCommand();
        testCommand.name = "Test Light Command";
        
        
        testCommand.states = Array.apply(null, Array(10)).map(function(){return state;});
        testCommand.save();
    }
}
