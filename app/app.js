import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';
import PaginatedArray from './utils/paginated-array';
import DS from 'ember-data';
var App;

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});



DS.PromiseArray.reopen({
  paginate: function(opts) {
    return this.then(function(contents) {
      return PaginatedArray.create({delegate: contents, opts: opts})
                .loadFirstPage();
    });
  }
  //TODO: add promisy implementations of other methods?
});


DS.RecordArray.reopen({
  paginate: function(opts) {
    return PaginatedArray.create({delegate: this, opts: opts})
              .loadFirstPage();
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
