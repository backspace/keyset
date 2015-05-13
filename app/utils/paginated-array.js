import Ember from 'ember';

export default Ember.ArrayProxy.extend(Ember.MutableArray, {
  location: 0,
  pageSize: 10,
  behavior: 'replace',
  
  init: function() {
    //allow opts to be passed in for ctor convenience
    Ember.merge(this, this.opts);
    //make a defensive copy of the passed-in array
    this.set('content', this.get('delegate.content').slice(0));
    
    this._super();
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
  
  _pagesFetched: function(numPages) {
    var totalFetched = this.get('content.length'),
        location = this.get('location'),
        pageSize = this.get('pageSize');
    
    return totalFetched >= location + pageSize * (numPages + 1);
  },
  
  _fetchPages: function(numPages) {
    var store = this.get('delegate.store'),
        type = this.get('delegate.type'),
        cursor = this._nextPageCursor();
        
    if (this._pagesFetched(numPages) || !cursor) {
      return Ember.RSVP.resolve(this);
    }

    //TODO: handle loading, error states
    var query = this.get('delegate.query') || {};
    query.cursor = cursor;
    return store.findQuery(type, query).then((results) => {
      this.set('delegate', results);
      this.get('content').pushObjects(results.get('content'));
      //perform a recursive fetch in case this fetch didn't load enough results
      return this._fetchPages(numPages);
    });
  },
  
  loadFirstPage: function() {
    return this._fetchPages(0);
  },
  
  hasPrevPage: Ember.computed('location', function() {
    return this.get('location') > 0;
  }),
  
  prevPage: function() {
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    this.set('location', Math.max(location - pageSize, 0));
    
    //return promise to maintain parity with `nextPage()`
    return Ember.RSVP.resolve(this);
  },
  
  nextPage: function(numPages) {
    if (!numPages && numPages !== 0) {
      numPages = 1;
    }
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    //TODO: multiple calls should have no effect while fetching
    return this._fetchPages(numPages).then(() => {
      var contentLength = this.get('content.length');
      var lastPage = contentLength - contentLength % pageSize
      this.set('location', Math.min(lastPage, location + (numPages * pageSize)));
      return this;
    });
  }
});
