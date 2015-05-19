import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
import PaginatedArray from 'ember-keyset-pagination/paginated-array';

var App;

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  Resolver: Resolver
});

var arrayExtensions = {
  paginate: function(opts) {
      return PaginatedArray.create({delegate: this, opts: opts})
                .loadFirstPage();
  }
};

DS.PromiseArray.reopen(arrayExtensions);
DS.RecordArray.reopen(arrayExtensions);

loadInitializers(App, config.modulePrefix);

export default App;
