import Ember from 'ember';
import PaginatedArray from 'ember-keyset-pagination/paginated-array';

export default {
  name: 'keyset-pagination-initializer',
  initialize: function(container, app) {
    
    var arrayExtensions = {
      paginate: function(opts) {
          return PaginatedArray.create({delegate: this, opts: opts})
                    .loadFirstPage();
      }
    };

    DS.PromiseArray.reopen(arrayExtensions);
    DS.RecordArray.reopen(arrayExtensions);
    DS.ManyArray.reopen(arrayExtensions);

  }
}