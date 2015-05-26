/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-keyset-pagination',
  included: function(app) {
    this._super.included(app);

    app.import(app.bowerDirectory + '/uri.js/src/URI.js');
  }
};
