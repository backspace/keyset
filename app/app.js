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
    this.set('backingContent', this.get('delegate.content'));
    this.set('store', this.get('delegate.store'));
    this.set('type', this.get('delegate.type'));
    this.set('backingStore', this.get('delegate.content'));
    this.get('content').pushObjects(this.get('backingStore'));
  },
  
  nextPage: function() {
    var self = this;
    var store = this.get('store');
    var type = this.get('type');
    //TODO: grab meta off object if possible (findQuery)
    var meta = store.metadataFor(type);
    if (!meta || !meta.cursor) {
      throw new Error("no cursor metadata found")
    }
    
    //TODO: add original query params for query results
    //TODO: handle loading, error states
    store.findQuery(type, {cursor: meta.cursor.next}).then(function(results) {
      // the only way I can trigger an update is to create an entirely new array here.
      var newContent = Ember.A();
      newContent.pushObjects(self.get('content'));
      newContent.pushObjects(results.get('content'));
      self.set('content', newContent)
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
