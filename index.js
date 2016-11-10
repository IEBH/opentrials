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
		},
	},


	/**
	* Get a OpenTrial by its ID
	* @param {string} trial The tiral ID e.g. '4cd4011e-8caf-11e6-be70-0242ac12000f'
	* @param {function} callback The callback returning an error and/or the trial
	* @return {Object} This chainable object
	*/
	get: argy('string [object] function', function(trial, settings, callback) {
		var config = _.defaultsDeep(settings, ot.config);

		request.get(mustache.render(config.urls.get, {config: config, trial: trial}))
			.end(function(err, res) {
				if (err) return callback(err);
				if (res.body.error) return callback(res.body.error);

				callback(null, ot.tidy(res.body, config));
			});

		return ot;
	},

	/**
	* Tidy up a open trial result
	* See the documentatin in README.md for all the operations this function performs
	* @param {Object} obj The object to tidy
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
