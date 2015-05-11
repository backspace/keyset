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
  content: Ember.A(),
  location: 0,
  pageSize: 10,
  behavior: 'append',
  
  init: function() {
    //allow opts to be passed in for ctor convenience
    Ember.merge(this, this.opts)
    
    //make a defensive copy of the passed-in array
    this.get('content').pushObjects(this.get('delegate.content'));
    
    this._super();
  },
  
  arrangedContent: Ember.computed('content', 'location', 'pageSize', function() {
    var start = 0,
        location = this.get('location'),
        content = this.get('content'),
        pageSize = this.get('pageSize'),
        behavior = this.get('behavior');
        
    if (behavior === 'replace') {
      start = location;
    }
    
    return content.slice(start, location + pageSize);
  }),
  
  nextPageLoaded: function() {
    var available = this.get('content.length'),
        location = this.get('location'),
        pageSize = this.get('pageSize');
    
    return available > location + pageSize;
  },
  
  loadNextPage: function() {
    if (this.nextPageLoaded()) {
      return Ember.RSVP.resolve(false);
    }
    var store = this.get('delegate.store');
    var type = this.get('delegate.type');
    //TODO: grab meta off object if possible (findQuery)
    var meta = this.get('delegate.meta') || store.metadataFor(type);
    if (!meta || !meta.cursor) {
      throw new Error("no cursor metadata found")
    }
    //TODO: add original query params for query results
    //TODO: handle loading, error states
    return store.findQuery(type, {cursor: meta.cursor.next}).then((results) => {
      this.set('delegate', results);
      //TODO: we may need additional fetches, ensure we have enough for a full page here
      this.get('content').pushObjects(results.get('content'));
      return true;
    });
  },
  
  nextPage: function() {
    this.loadNextPage().then((didFetchData) => {
      this.set('location', this.get('location') + this.get('pageSize'))
    })
  }
})

DS.PromiseArray.reopen({
  paginate: function(opts) {
    return this.then(function(contents) {
      return PaginatedArray.create({delegate: contents, opts: opts})
    })
  }
  //TODO: add promisy implementations of other methods?
});


DS.RecordArray.reopen({
  paginate: function(opts) {
    return PaginatedArray.create({delegate: this, opts: opts})
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
