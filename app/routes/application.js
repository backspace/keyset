import Ember from 'ember';

export default Ember.Route.extend({
  model:function() {
    return this.store.find("transaction").paginate({
      pageSize: 10,
      behavior: 'replace'
    });
  },
  
  actions: {
    next: function() {
      this.currentModel.nextPage()
    },
    prev: function() {
      this.currentModel.prevPage()
    }
  }
})