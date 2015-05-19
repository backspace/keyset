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

loadInitializers(App, config.modulePrefix);

export default App;
