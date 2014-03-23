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
    states: [lightStateSchema]
});

var LightCommand = mongoose.model('LightCommand', lightCommandSchema);
exports.LightCommand = LightCommand;


/////////////////////
// Test Data
/////////////////////
var testing = true;
if (testing) {
    LightCommand.collection.drop();
    LightState.collection.drop();
    for (i = 0; i < 100; i++) {
        var blueState = new LightState();
        blueState.name = "Blue";
        blueState.isOn = true;
        blueState.effect = 'none';
        blueState.brightness = 255;
        blueState.saturation = 255;
        blueState.hue = 600 * i;
        blueState.transitionTime = 5;
        blueState.save();
        
        var testCommand = new LightCommand();
        testCommand.name = "Test Light Command";
        
        
        // testCommand.states = Array.apply(null, Array(10)).map(function(){return blueState;});
        testCommand.states = [blueState, blueState, blueState, blueState, blueState, blueState, blueState, blueState, blueState, blueState];
        testCommand.save();
    }
}
