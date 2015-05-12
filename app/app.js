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
    
    this._super();
    
    //make a defensive copy of the passed-in array
    this.get('content').pushObjects(this.get('delegate.content'));
    
    // fetch now in case we don't have enough data for a full page
    this.fetchNextPage();
  },
  
  arrangedContent: Ember.computed('content.@each', 'location', 'pageSize', function() {
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
  
  _nextPageCursor: function() {
    var store = this.get('delegate.store'),
        type = this.get('delegate.type'),
        meta = this.get('delegate.meta') || store.metadataFor(type);
    
    return meta && meta.cursor && meta.cursor.next;
  },
  
  nextPageFetched: function() {
    var total = this.get('content.length'),
        location = this.get('location'),
        pageSize = this.get('pageSize');
    
    return total > (location + pageSize) * 2;
  },
  
  fetchNextPage: function() {
    var store = this.get('delegate.store'),
        type = this.get('delegate.type'),
        cursor = this._nextPageCursor();
        
    if (this.nextPageFetched() || !cursor) {
      return Ember.RSVP.resolve();
    }
    //TODO: add original query params for query results
    //TODO: handle loading, error states
    return store.findQuery(type, {cursor: cursor}).then((results) => {
      this.set('delegate', results);
      this.get('content').pushObjects(results.get('content'));
      //perform a recursive fetch in case this fetch didn't load enough results
      return this.fetchNextPage();
    });
  },
  
  hasPrevPage: Ember.computed('location', function() {
    return this.get('location') > 0;
  }),
  
  prevPage: function() {
    var location = this.get('location'),
        pageSize = this.get('pageSize')
    this.set('location', Math.max(location - pageSize, 0))
  },
  
  nextPage: function() {
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    //TODO: multiple calls should have no effect while fetching
    this.fetchNextPage().then(() => {
      this.set('location', location + pageSize)
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
