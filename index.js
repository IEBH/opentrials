var _ = require('lodash');
var argy = require('argy');
var async = require('async-chainable');
var events = require('events');
var mustache = require('mustache');
var request = require('superagent');
var traverse = require('traverse');
var util = require('util');

function OpenTrials() {
	var ot = this;

	ot.config = {
		tidy: {
			keys: true,
			dates: true,
			dateKeys: [/Date$/, 'createdAt', 'updatedAt', 'metaCreated', 'metaUpdated'],
			populate: false,
			populateKeys: ['records'],
		},

		urls: {
			get: 'https://api.opentrials.net/v1/trials/{{trial}}',
			search: 'https://api.opentrials.net/v1/search?q={{search}}&page={{page}}&per_page={{pageLimit}}',
		},

		// Used during search:
		page: 1,
		pageLimit: 10,
	};


	/**
	* Get a OpenTrial by its ID
	* @param {string} trial The trial ID e.g. '4cd4011e-8caf-11e6-be70-0242ac12000f'
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {boolean} [settings.rawResponse] Whether to return the original, unedited superagent response object
	* @param {function} callback The callback returning an error and/or the trial
	* @return {Object} This chainable object
	*/
	ot.get = argy('string [object] function', function(trial, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		request.get(mustache.render(config.urls.get, {config: config, trial: trial}))
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.body.error) return callback(res.body.error);
				if (config.rawResponse) return callback(null, res);

				ot.tidy(res.body, config, callback);
			});

		return ot;
	});


	/**
	* Query OpenTrials results
	* @param {string|Object} search The search term (or object)
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {number} [settings.page] The page offset of results to return
	* @param {number} [settings.pageLimit] The number of results per page to return
	* @param {string} [settings.urls.search] The URL to use as an API end point
	* @param {boolean} [settings.rawResponse] Whether to return the original, unedited superagent response object
	* @param {function} callback The callback returning an error and/or the found trials
	* @return {Object} This chainable object
	*/
	ot.search = argy('string|object [object] function', function(search, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		request.get(mustache.render(config.urls.search, {config: config, search: search, page: config.page, pageLimit: config.pageLimit}))
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.body.error) return callback(res.body.error);
				if (config.rawResponse) return callback(null, res);

				// Run all objects via tidy {{{
				var items = [];
				async()
					.forEach(res.body.items, function(next, i) {
						ot.tidy(i, config, function(err, res) {
							if (err) return next(err);
							items.push(res);
							next();
						});
					})
					.end(function(err) {
						if (err) return callback(err);
						callback(null, items);
					});
				// }}}
			});

		return ot;
	});


	/**
	* Count OpenTrials query results
	* NOTE: This is actually the same as a search() operation with rawResult=true so we can get at the total
	* @see query()
	* @param {string|Object} search The search term (or object)
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {function} callback The callback returning an error and/or the found trials count
	* @return {Object} This chainable object
	*/
	ot.count = argy('string|object [object] function', function(search, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);
		config.rawResponse = true;
		config.pageLimit = 10; // Minimize result return as we're not actually interested in the list

		ot.search(search, config, function(err, res) {
			if (err) return callback(err);
			if (!_.has(res.body, 'total_count')) return callback('No count found in response');
			callback(null, res.body['total_count']);
		});

		return ot;
	});


	/**
	* Tidy up a open trial result
	* See the documentation in README.md for all the operations this function performs
	* @param {Object} obj The object to tidy
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {function} callback The callback returning an error and/or the tidied trial
	* @return {Object} This chainable object
	*/
	ot.tidy = argy('object [object] function', function(obj, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		setTimeout(function() { // Schedule on next tick so we can return the object immediately
			var newObj = traverse(obj).map(function() {
				// Keys {{{
				if (
					config.tidy.keys &&
					!this.isLeaf &&
					_.isObject(this.node) &&
					_.some(this.node, (v,k) => /_/.test(k))
				) {
					this.update(_.mapKeys(this.node, (v,k) => _.camelCase(k)));
				}
				// }}}
				// Dates {{{
				if (
					config.tidy.dates &&
					this.isLeaf &&
					config.tidy.dateKeys.some(i => _.isString(i) ? this.key == i : i.test(this.key))
				) {
					this.update(new Date(this.node), true);
				}
				// }}}
			});

			if (!config.tidy.populate) return callback(null, newObj);
			ot.populate(newObj, config, callback);
		});


		return ot;
	});


	/**
	* Follow all links to other resources and insert them in the object
	* This explodes any 'url' objects it finds that are specified in `config.tidy.populateKeys`
	* @fires {prePopulate} A prePopulate event will be fired before each fetch with the object being populated
	* @fires {postPopulate} A postPopulate event will be fired after each fetch with the previous object and the new one
	* @param {Object} obj The object to populate
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {function} callback The callback returning an error and/or the found trials count
	* @return {Object} The populated object
	*/
	ot.populate = argy('object [object] [function]', function(obj, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		async()
			.forEach(config.tidy.populateKeys, function(next, key) {
				if (!_.has(obj, key)) return next(); // Doesn't have the key - skip
				async()
					.forEach(obj[key], function(next, item, itemIndex) {
						if (!_.has(item, 'url')) return next(); // No URL to follow
						ot.emit('prePopulate', item);
						request.get(item.url)
							.end(function(err, res) {
								if (err) return next(err);
								if (res.body.error) return callback(res.body.error);
								ot.tidy(res.body, config, function(err, tidied) {
									if (err) return next(err);
									obj[key][itemIndex] = tidied;
									ot.emit('postPopulate', item, obj[key][itemIndex]);
									next();
								});
							});
					})
					.end(next);
			})
			.end(function(err) {
				if (err) return callback(err);
				callback(null, obj);
			});

		return ot;
	});

	ot.new = function() {
		return new OpenTrials();
	};

	return ot;
};

util.inherits(OpenTrials, events.EventEmitter);
module.exports = new OpenTrials();
