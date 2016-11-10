var expect = require('chai').expect;
var ot = require('..');

describe('clinicaltrials.search()', function() {

	it('should search for a simple term', function(done) {
		this.timeout(10 * 1000);

		ot.search('cancer', function(err, res) {
			expect(err).to.be.not.ok;

			expect(res).to.be.an.array;
			expect(res).to.have.length(10);

			res.forEach(function(ref) {
				expect(ref).to.be.an.object;
				expect(ref).to.have.property('id');
				expect(ref).to.have.property('briefSummary');
				expect(ref).to.have.property('publicTitle');
				expect(ref).to.have.property('targetSampleSize');
				expect(ref).to.have.property('risksOfBias');
				expect(ref).to.have.property('registrationDate');
				expect(ref.registrationDate).to.be.an.instanceOf(Date);
				expect(ref).to.have.deep.property('records');
				ref.records.forEach(rec => expect(rec.updatedAt).to.be.an.instanceOf(Date));
			});

			done();
		});
	});

})
