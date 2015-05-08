import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

var App;

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

DS.RecordArray.reopen({
  nextPage: function() {
    var self = this;
    //TODO: grab meta off object if possible
    var meta = self.store.metadataFor(self.type);
    if (!meta || !meta.cursor) {
      throw new Error("no cursor metadata found")
    }
    
    //TODO: add original query params for query results
    //TODO: handle loading, error states
    self.store.findQuery(self.type, {cursor: meta.cursor.next});
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
