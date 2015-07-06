import Ember from 'ember';

export default Ember.Component.extend({
  /**
  Element for the container to watch for scroll events.

  @property
  @type String
  */
  containerElement: null,

  /**
  Selector for the container to watch for scroll events, if `containerElement`
  is not specified. Defaults to the component's element.
  
  @property
  @type String
  */
  containerSelector: null,
  
  /**
  The paginated array containing the elements to scroll
  
  @property
  @type PaginatedArray
  */
  contents:null,
  
  didInsertElement: function() {
    var container = this.get('containerElement') || Ember.$(this.get('containerSelector') || this.$());

    this.set('scrollListener', () => {
      Ember.run.debounce(this, this.checkScroll, container, 20);
    });
    
    container.on('scroll', this.get('scrollListener'))
    
    this.checkScroll(container);
  },
  
  willDestroyElement: function() {
    var container = this.get('containerElement') || Ember.$(this.get('containerSelector') || this.$());
    container.off('scroll', this.get('scrollListener'))

  },
  
  checkScroll: function(container) {
    if (this.get('isDestroyed') || this.get('isDestroying') || !this.get('contents').nextPage) {
      return;
    }
    var content = this.$();
    if (!content) {
      return;
    }
    var contentHeight = content.height();
    if (content[0].scrollHeight) {
      //  if the content element is scrollable, use the scrollHeight to calculate the content height
      // this allows us to use the same element for content and container.
      contentHeight = content[0].scrollHeight;
    }
    if (contentHeight < (container.height() * 2) + container.scrollTop()) {
      if (!this.get('contents.isUpdating')) {
        this.get('contents').nextPage();
      }
    }
  }
});