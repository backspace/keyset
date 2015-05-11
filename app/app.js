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

var PaginatedArray = Ember.ArrayProxy.extend(Ember.MutableArray, {
  init: function() {
    this.set('content', Ember.A());
    //make a defensive copy of the passed-in array
    this.get('content').pushObjects(this.get('delegate.content'));
    this._super();
  },
  
  nextPage: function() {
    var self = this;
    var store = this.get('delegate.store');
    var type = this.get('delegate.type');
    //TODO: grab meta off object if possible (findQuery)
    var meta = store.metadataFor(type);
    if (!meta || !meta.cursor) {
      throw new Error("no cursor metadata found")
    }
    
    //TODO: add original query params for query results
    //TODO: handle loading, error states
    store.findQuery(type, {cursor: meta.cursor.next}).then(function(results) {
      self.pushObjects(results.get('content'));
    });
  }
})

DS.PromiseArray.reopen({
  paginate: function(opts) {
    return this.then(function(contents) {
      return PaginatedArray.create({delegate: contents})
    })
  }
  //todo: add promisy implementations of other methods?
});


DS.RecordArray.reopen({
  paginate: function() {
    return PaginatedArray.create({delegate: this})
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
