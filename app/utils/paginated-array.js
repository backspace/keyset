import Ember from 'ember';

export default Ember.ArrayProxy.extend(Ember.MutableArray, {
  content: Ember.A(),
  location: 0,
  pageSize: 10,
  behavior: 'replace',
  
  init: function() {
    //allow opts to be passed in for ctor convenience
    Ember.merge(this, this.opts);
    
    this._super();
    
    //make a defensive copy of the passed-in array
    this.get('content').pushObjects(this.get('delegate.content'));
    
    // fetch first page now in case we don't have enough data for a full page
    this.fetchPages(0);
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
  
  pagesFetched: function(numPages) {
    var totalFetched = this.get('content.length'),
        location = this.get('location'),
        pageSize = this.get('pageSize');
    
    return totalFetched >= location + pageSize * (numPages + 1);
  },
  
  fetchPages: function(numPages) {
    var store = this.get('delegate.store'),
        type = this.get('delegate.type'),
        cursor = this._nextPageCursor();
        
    if (this.pagesFetched(numPages) || !cursor) {
      return Ember.RSVP.resolve();
    }
    //TODO: add original query params for query results
    //TODO: handle loading, error states
    return store.findQuery(type, {cursor: cursor}).then((results) => {
      this.set('delegate', results);
      this.get('content').pushObjects(results.get('content'));
      //perform a recursive fetch in case this fetch didn't load enough results
      return this.fetchPages(numPages);
    });
  },
  
  hasPrevPage: Ember.computed('location', function() {
    return this.get('location') > 0;
  }),
  
  prevPage: function() {
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    this.set('location', Math.max(location - pageSize, 0));
  },
  
  nextPage: function() {
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    //TODO: multiple calls should have no effect while fetching
    this.fetchPages(1).then(() => {
      this.set('location', location + pageSize);
    });
  }
});
