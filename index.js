var _ = require('lodash');
var argy = require('argy');
var mustache = require('mustache');
var request = require('superagent');
var traverse = require('traverse');

var ot = module.exports = {
	config: {
		tidy: {
			keys: true,
			dates: true,
			dateKeys: [/Date$/, 'updatedAt'],
		},

		urls: {
			get: 'https://api.opentrials.net/v1/trials/{{trial}}',
			search: 'https://api.opentrials.net/v1/search?q={{search}}&page={{page}}&per_page={{pageLimit}}',
		},

		// Used during search:
		page: 1,
		pageLimit: 10,
	},


	/**
	* Get a OpenTrial by its ID
	* @param {string} trial The trial ID e.g. '4cd4011e-8caf-11e6-be70-0242ac12000f'
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {boolean} [settings.rawResponse] Whether to return the original, unedited superagent response object
	* @param {function} callback The callback returning an error and/or the trial
	* @return {Object} This chainable object
	*/
	get: argy('string [object] function', function(trial, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		request.get(mustache.render(config.urls.get, {config: config, trial: trial}))
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.body.error) return callback(res.body.error);
				if (config.rawResponse) return callback(null, res);

				callback(null, ot.tidy(res.body, config));
			});

		return ot;
	}),


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
	search: argy('string|object [object] function', function(search, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		request.get(mustache.render(config.urls.search, {config: config, search: search, page: config.page, pageLimit: config.pageLimit}))
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.body.error) return callback(res.body.error);
				if (config.rawResponse) return callback(null, res);

				callback(null, res.body.items.map(i => ot.tidy(i, config)));
			});

		return ot;
	}),


	/**
	* Count OpenTrials query results
	* NOTE: This is actually the same as a search() operation with rawResult=true so we can get at the total
	* @see query()
	* @param {string|Object} search The search term (or object)
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @param {function} callback The callback returning an error and/or the found trials count
	* @return {Object} This chainable object
	*/
	count: argy('string|object [object] function', function(search, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);
		config.rawResponse = true;
		config.pageLimit = 10; // Minimize result return as we're not actually interested in the list

		ot.search(search, config, function(err, res) {
			if (err) return callback(err);
			if (!_.has(res.body, 'total_count')) return callback('No count found in response');
			callback(null, res.body['total_count']);
		});

		return ot;
	}),


	/**
	* Tidy up a open trial result
	* See the documentation in README.md for all the operations this function performs
	* @param {Object} obj The object to tidy
	* @param {Object} [settings] Optional settings specific to this invocation, if unspecified the defaults are used
	* @return {Object} The tidied object
	*/
	tidy: argy('object [object]', function(obj, settings) {
		var config = _.defaultsDeep(settings, ot.config);

		return traverse(obj).map(function() {
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
	}),
};
