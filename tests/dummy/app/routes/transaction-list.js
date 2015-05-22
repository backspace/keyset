import Ember from 'ember';

export default Ember.Route.extend({
  model:function() {
    return this.store.find("transaction", {year: 2013, month: 5}).paginate({
      pageSize: 30,
      behavior: 'replace'
    });
  },
  
  actions: {
    next: function() {
      this.currentModel.nextPage();
    },
    prev: function() {
      this.currentModel.prevPage();
    }
  }
});
