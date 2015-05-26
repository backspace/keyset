import Ember from 'ember';

export default Ember.Component.extend({
  /**
  Selector for the container to watch for scroll events. Defaults to the component's element.
  
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
    var container = Ember.$(this.get('containerSelector') || this.$());

    container.on('scroll', () => {
      Ember.run.debounce(this, this.checkScroll, container, 20);
    });
    
    this.checkScroll(container);
  },
  
  checkScroll: function(container) {
    var content = this.$();
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