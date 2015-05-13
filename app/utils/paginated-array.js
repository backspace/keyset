import Ember from 'ember';

export default Ember.ArrayProxy.extend(Ember.MutableArray, {
  location: 0,
  pageSize: 10,
  behavior: 'replace',
  content: Ember.A(),
  initialized: false,
  
  init: function() {
    //allow opts to be passed in for ctor convenience
    Ember.merge(this, this.opts);
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
    return this.nextPage(0);
  },
  
  isUpdating: Ember.computed('_nextPagePromise', function() {
    return !!this.get('_nextPagePromise');
  }),
  
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
  
  hasNextPage: Ember.computed('location', 'delegate', function() {
    var cursor = this._nextPageCursor();
    return !!cursor || this.get('location') + this.get('pageSize') < this.get('content.length');
  }),
  
  nextPage: function(numPages) {
    if (!numPages && numPages !== 0) {
      numPages = 1;
    }
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    //if we are updating, just return the promise that is in progress
    if (this.get('isUpdating')) {
      return this.get('_nextPagePromise');
    }
    
    var initializeDelegate = Ember.RSVP.Promise.resolve(this.get('delegate')).then((delegate) => {
      if (!this.get('initialized')) {
        this.set('delegate', delegate);
        //make a defensive copy of the passed-in array
        this.set('content', this.get('delegate.content').slice(0));
        this.set('initialized', true);
      }
    });
    
    var fetchNext = initializeDelegate.then(() => {
      return this._fetchPages(numPages);
    });
    
    var updateLocation = fetchNext.then(() => {
      var contentLength = this.get('content.length');
      var lastPage = contentLength - contentLength % pageSize
      this.set('location', Math.min(lastPage, location + (numPages * pageSize)));
      return this;
    });
    
    //store the promise in case nextPage() is called again, we'll just return it.
    this.set('_nextPagePromise', updateLocation);
    
    updateLocation.finally(() => {
      this.set('_nextPagePromise', null); //clear the promise when done
    })
    
    return updateLocation;
  }
});
