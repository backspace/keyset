import Ember from 'ember';

export default Ember.Component.extend({
  /**
  Selector for the container to watch for scroll events. Defaults to `window`.
  
  @property
  @type String
  */
  containerSelector: null,
  
  didInsertElement: function() {
    var container = $(this.get('containerSelector') || window);

    container.on('scroll', () => {
      Ember.run.debounce(this, this.checkScroll, container, 20);
    });
  },
  
  checkScroll: function(container) {
    var content = this.$();
    
    if (content.height() < (container.height() * 2) + container.scrollTop()) {
      this.get('contents').nextPage();
    }
  }
});