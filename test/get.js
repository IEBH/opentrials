var expect = require('chai').expect;
var ot = require('..');

describe('clinicaltrials.get()', function() {

	var ref;
	before('should get a simple reference', function(done) {
		this.timeout(10 * 1000);

		ot.get('4cd4011e-8caf-11e6-be70-0242ac12000f', function(err, res) {
			expect(err).to.be.not.ok;

			ref = res;

			done();
		});
	});

	it('should have retrieved the reference', function() {
		expect(ref).to.be.an.object;
		expect(ref).to.have.property('id', '4cd4011e-8caf-11e6-be70-0242ac12000f');
	});

	it('should have tidied up keys', function() {
		expect(ref).to.have.property('briefSummary');
		expect(ref).to.have.property('publicTitle');
		expect(ref).to.have.property('targetSampleSize');
		expect(ref).to.have.property('risksOfBias');
	});

	it('should have tidied up dates', function() {
		expect(ref).to.have.property('registrationDate');
		expect(ref.registrationDate).to.be.an.instanceOf(Date);

		expect(ref).to.have.deep.property('records');
		ref.records.forEach(rec => expect(rec.updatedAt).to.be.an.instanceOf(Date));
	});

})
