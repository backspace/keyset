import Ember from 'ember';
import DS from "ember-data";

/* global URI */

export default Ember.ArrayProxy.extend(Ember.MutableArray, {
  /**
    The number of records to load per page
    @property pageSize
    @type number
  */
  pageSize: 10,
  
  /**
    The way content is added to the array:
      - replace: replace the contents of the current page with the next page
      - append: append the contents of the next page to the current page
    @property behavior
    @type String
  */
  behavior: 'replace',
  
  /**
    The index of the current page, for "replace" behavior.
    @property location
    @type number
    @private
  */
  location: 0,
  /**
    The array containing all loaded values
    
    @property content
    @type array
    @private
  */
  content: Ember.A(),
  
  /**
    Whether or not we have initialized the first page of data
    
    @property initialized
    @type Boolean
    @private
  */
  initialized: false,
  
  init: function() {
    //allow opts to be passed in for ctor convenience
    Ember.merge(this, this.opts);
    this._super();
  },
  
  
  /**
    The record array that we will paginate
    
    @property delegate
    @type DS.RecordArray | Promise => DS.RecordArray
  */
  delegate: new Ember.RSVP.Promise(function(reject) {
    reject("delegate is required");
  }),
  
  /**
    provide `arrangedContent` for `ArrayProxy` - a view of the current page
    
    @private
  */
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
  
  /**
    Based on the current page, fetch the cursor object for the next page
    
    @private
  */
  _nextPageCursor: function() {
    var store = this.get('delegate.store'),
        type = this.get('delegate.type'),
        meta = this.get('delegate.meta') || store.metadataFor(type);
    
    return meta && meta.cursor && meta.cursor.next;
  },
  
  /**
    Calculate whether the given number of pages have already been fetched
    
    @private
  */
  _pagesFetched: function(numPages, additionalRows) {
    var totalFetched = this.get('content.length') + additionalRows,
        location = this.get('location'),
        pageSize = this.get('pageSize');
    
    return totalFetched >= location + pageSize * (numPages + 1);
  },
  
  /**
    Fetch enough data for the given number of pages, if needed.
    
    @param numPages the number of pages from `location` to fetch data for.
           if `numPages` is 0, we will fetch data for the current page only.
           Default: 1
    @param prevResults the previous page of results, when performing a recursive call
    @param intermediateResults the intermediate array of results from recursive fetch calls
    @return a promise which will be fulfilled with this when the pages have been fetched
    @private
  */
  _fetchPages: function(numPages, intermediateResults) {
    var store = this.get('delegate.store'),
        type = this.get('delegate.type'),
        cursor = this._nextPageCursor();

    if (!intermediateResults) {
      intermediateResults = Ember.A();
    }

    if (this._pagesFetched(numPages, intermediateResults.length) || !cursor) {
      //don't update the underlying array until we have all our results.
      //this prevents uneeded rendering
      this.get('content').pushObjects(intermediateResults);
      return Ember.RSVP.resolve(this);
    }

    var fetchPromise, 
        linkBackup;
    if(this.get('delegate') instanceof DS.ManyArray) {
      //update the link of has-many 
      var relationship = this.get('delegate.relationship');
      if (relationship.link) {
        linkBackup = relationship.link;
        var linkUri = URI(relationship.link);
        linkUri.setQuery("cursor", cursor);
        relationship.updateLink(linkUri.toString());
      }
      fetchPromise = this.get('delegate').reload();
    } else {
      var query = this.get('delegate.query') || {};
      query.cursor = cursor;
      fetchPromise = store.findQuery(type, query);
    }
    
    return fetchPromise.then((results) => {
      if(this.get('delegate') instanceof DS.ManyArray) {
        //restore the original link, for future use
        var relationship = this.get('delegate.relationship');
        relationship.updateLink(linkBackup);
      }
      this.set('delegate', results);
      intermediateResults.pushObjects(results.toArray());
      //perform a recursive fetch in case this fetch didn't load enough results
      return this._fetchPages(numPages, intermediateResults);
    });
  },
  
  /**
    Fetch enough data for the current page, if needed. This method should be called
    on a new object. 
    
    @return a promise which will be fulfilled with this when all data for the current page is fetched
  */
  firstPage: function() {
    this.set('location', 0);
    return this.nextPage(0);
  },
  
  /**
    Flag to signal whether or not the array is currently updating data
    
    @property isUpdating
    @type Boolean
  */
  isUpdating: Ember.computed('_nextPagePromise', function() {
    return !!this.get('_nextPagePromise');
  }),
  
  /**
    Flag to signal whether or not the array has a previous page of data
    
    @property hasPrevPage
    @type Boolean
  */
  hasPrevPage: Ember.computed('location', function() {
    return this.get('location') > 0;
  }),
  
  
  /**
    Flag to signal whether or not the array is at the first page of data.
    
    Negation of `hasPrevPage`, provided for ease of use from Handlebars templates.
    
    @property onFirstPage
    @type Boolean
  */
  onFirstPage: Ember.computed('hasPrevPage', function() {
    return !this.get('hasPrevPage');
  }),
  
  /**
    Navigate to the previous page of data
    
    @return a promise to `this` array, with the previous page populated.
  */
  prevPage: function() {
    var location = this.get('location'),
        pageSize = this.get('pageSize');
        
    this.set('location', Math.max(location - pageSize, 0));
    
    //return promise to maintain parity with `nextPage()`
    return Ember.RSVP.resolve(this);
  },
  
  /**
    Flag to signal whether or not the array has more pages of data
    
    @property hasNextPage
    @type Boolean
  */
  hasNextPage: Ember.computed('location', 'delegate', function() {
    var cursor = this._nextPageCursor();
    return !!cursor || this.get('location') + this.get('pageSize') < this.get('content.length');
  }),
  
  /**
    Flag to signal whether or not the array is at the last page of data.
    
    Negation of `hasNextPage`, provided for ease of use from Handlebars templates.
    
    @property onLastPage
    @type Boolean
  */
  onLastPage: Ember.computed('hasNextPage', function() {
    return !this.get('hasNextPage');
  }),
  
  /**
    Navigate to the next page of data
    @param numPages the number of pages from current page to fetch data for.
           if `numPages` is 0, we will fetch data for the current page only.
           Default: 1
    @return a promise to `this` array, with the next page populated.
  */
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
        this.set('content', this.get('delegate').toArray());
        this.set('initialized', true);
      }
    });
    
    var fetchNext = initializeDelegate.then(() => {
      return this._fetchPages(numPages);
    });
    
    var updateLocation = fetchNext.then(() => {
      var contentLength = this.get('content.length');
      var lastPage = contentLength - contentLength % pageSize;
      this.set('location', Math.min(lastPage, location + (numPages * pageSize)));
      return this;
    });
    
    //store the promise in case nextPage() is called again, we'll just return it.
    this.set('_nextPagePromise', updateLocation);
    
    updateLocation.finally(() => {
      this.set('_nextPagePromise', null); //clear the promise when done
    });
    
    return updateLocation;
  },

  /**
  Find and move to the page containing the item matching the given predicate

  TODO: This will probably cause the list to be re-rendered for each page it looks at.
        I looked into modifying `nextPage` to accept a predicate, but the logic got very
        complicated and buggy. Best to call this function before rendering to the template.
  TODO: I think this runs the predicate for each item when the mode is 'append'.
        This could cause performance issues for larger data sets.

  @param predicate: a function which will be called with each item. return `true` if the item matches.
  @param currentPage: mostly for recursive calls, but could be passed in to start at a page other than the first page.
  **/
  findPage(predicate, currentPage = this.firstPage()) {
    return currentPage.then((items) => {
      if (items.find(predicate)) {
        return items;
      } else if(!this.get('hasNextPage')) {
        //matching item not found, return to first page.
        return this.firstPage();
      } else {
        return this.findPage(predicate, this.nextPage());
      }
    });
  }
});
