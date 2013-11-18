var file = process.argv[2];
var Mocha = require("mocha");
var mochaOpts = {
    reporter: "spec",
    timeout: 500,
    slow: Infinity
};

var mocha = new Mocha(mochaOpts);
mocha.addFile(process.argv[2]);
mocha.run(function(err){

}).on( "fail", function( test, err ) {
    process.stderr.write(test.title + "\n" + err.stack + "\n");
    process.exit(-1);
});
