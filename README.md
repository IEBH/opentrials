OpenTrials
==========
A simple Node adapter to interact with the [OpenTrials.net](https://opentrials.net) API.


API
===

config
------
Config is stored in the `config` object. Values can be changed by setting them directly or by passing them into each function.

| Key             | Type    | Default Value   | Description                                                                    |
|-----------------|---------|-----------------|--------------------------------------------------------------------------------|
| `tidy.keys`     | Boolean | `true`          | Whether to tidy up keys to camelCase                                           |
| `tidy.dates`    | Boolean | `true`          | Whether to tidy up date values to JavaScript Date types                        |
| `tidy.dateKeys` | Array   | See source code | An array of strings and regular expressions when converting keys to date types |
| `urls`          | Object  | See source code | URL end points to use when interacting with the OpenTrials API                 |
| `page`          | Number  | `1`             | The page offset of results to return when using `search()`                     |
| `pageLimit`     | Number  | `10`            | The number of items to return per page when using `search()`                   |


count(terms, [settings], callback)
-----------------------------------
Return the number of matching OpenTrials by a query.

This function will return a single number of the matching trials.

```javascript
var ot = require('opentrials');

ot.count('cancer', function(err, res) {
	// Err is any error that occured
	// Res is the number of found trials
});
```


get(trialId, [settings], callback)
----------------------------------
Retrieve a single trial by its OTID.

```javascript
var ot = require('opentrials');

ot.get('4cd4011e-8caf-11e6-be70-0242ac12000f', function(err, res) {
	// Err is any error that occured
	// Res is the trial object
});
```


search(terms, [settings], callback)
-----------------------------------
Search for multiple OpenTrials by a query.

This will return an array of all found trials split into pages. You can change the page offset by setting `settings.page` (or the number within a page with `settings.pageLimit`).

```javascript
var ot = require('opentrials');

ot.search('cancer', function(err, res) {
	// Err is any error that occured
	// Res is the found trials
});
```


tidy(trialObject, [settings])
-----------------------------
Tidy up a raw OT JSON response.

Behaviours include:

* Tidying up keys so they use [camelCase](https://en.wikipedia.org/wiki/Camel_case) rather than [snake_case](https://en.wikipedia.org/wiki/Snake_case). Configure by setting `opentrials.config.tidy.keys`.
* Tidying up the raw string dates to JavaScript Date objects. Configure by setting `opentrials.config.tidy.date*`.

This function is automatically invoked during `get()` calls.
