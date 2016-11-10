var expect = require('chai').expect;
var ot = require('..');

describe('clinicaltrials.new()', function() {

	it('should create a new instance', function() {
		ot.foo = 'FOO!';
		expect(ot).to.have.property('foo');
		var newOt = ot.new();
		expect(newOt).to.not.have.property('foo');
	});

});
