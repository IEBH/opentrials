var expect = require('chai').expect;
var ot = require('..');
var mlog = require('mocha-logger');

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

	it('should be able to populate the object', function(done) {
		this.timeout(10 * 1000);

		ot
			.on('prePopulate', i => mlog.log('fetch', i.url))
			.populate(ref, function(err, ref) {
				expect(err).to.be.not.ok;

				expect(ref).to.have.property('records');
				expect(ref.records).to.be.an.array;
				expect(ref.records).to.have.length.above(0);
				ref.records.forEach(function(o) {
					expect(o).to.be.an.object;
					expect(o).to.have.property('source');
					expect(o.source).to.be.an.object;
					expect(o.source).to.have.property('name');
					expect(o).to.have.property('sourceData');
					expect(o.sourceData).to.have.property('studyType');
				});

				done();
			});
	});
});


describe('clinicaltrials.get() - fully populated', function() {

	var ref;
	before('should get a reference', function(done) {
		this.timeout(10 * 1000);

		ot
			.on('prePopulate', i => mlog.log('fetch', i.url))
			.get('5f19339c-8cfc-11e6-988b-0242ac12000c', {
				tidy: {
					populate: true,
				},
			}, function(err, res) {
				expect(err).to.be.not.ok;

				ref = res;

				done();
			});
	});

	it('should have retrieved the reference', function() {
		expect(ref).to.be.an.object;
		expect(ref).to.have.property('id', '5f19339c-8cfc-11e6-988b-0242ac12000c');
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

	it('should have populated the object', function() {
		expect(ref).to.have.property('records');
		expect(ref.records).to.be.an.array;
		expect(ref.records).to.have.length.above(0);
		ref.records.forEach(function(o) {
			expect(o).to.be.an.object;
			expect(o).to.have.property('source');
			expect(o.source).to.be.an.object;
			expect(o.source).to.have.property('name');
			expect(o).to.have.property('sourceData');
			expect(o.sourceData).to.have.property('studyType');
		});
	});
});
