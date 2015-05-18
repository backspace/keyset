import Ember from 'ember';

export default Ember.Route.extend({
    model:function() {
      return this.store.find("transaction").paginate({
        pageSize: 50,
        behavior: 'append'
      });
    },
});
