var expect = require('chai').expect;
var ot = require('..');

describe('clinicaltrials.count()', function() {

	it('should count the records for a simple term', function(done) {
		this.timeout(10 * 1000);

		ot.count('cancer', function(err, res) {
			expect(err).to.be.not.ok;

			expect(res).to.be.a.number;
			expect(res).to.be.above(0);

			done();
		});
	});

});
