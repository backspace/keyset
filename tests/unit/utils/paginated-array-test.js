import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from "../../helpers/start-app"
import config from '../../../config/environment';

var app, 
    store;
    
module('model:transaction', {
  setup: function() {
    app = startApp();
    store = app.__container__.lookup("store:main");
  }
});

test('truncates results to the given page size', function(assert) {
  var transactions = store.find('transaction')
                        .paginate({pageSize: 10});

  return transactions.then(function(txs) {
    assert.equal(txs.get('length'), 10);
  });                      
});

test('replaces current page with the next page', function(assert) {
  var transactions = store.find('transaction')
                        .paginate({pageSize: 10});

  return transactions.then(function(txs) {
    assert.equal(txs.get('length'), 10);
    assert.equal(txs.get('firstObject.id'), "53523");
    assert.equal(txs.get('lastObject.id'), "53586");
    assert.equal(txs.get('hasPrevPage'), false);
    
    return txs.nextPage().then(function() {
      assert.equal(txs.get('length'), 10);
      assert.equal(txs.get("firstObject.id"), "53593");
      assert.equal(txs.get("lastObject.id"), "53656");
      assert.equal(txs.get('hasPrevPage'), true);
      
      return txs.prevPage().then(function() {
        assert.equal(txs.get('length'), 10);
        assert.equal(txs.get('firstObject.id'), "53523");
        assert.equal(txs.get('lastObject.id'), "53586");
        assert.equal(txs.get('hasPrevPage'), false);
      })
    })
  })
});

test('append behavior', function(assert) {
  var transactions = store.find('transaction')
                        .paginate({pageSize: 10, behavior: 'append'});
  
  return transactions.then(function(txs) {
    assert.equal(txs.get('length'), 10);
    assert.equal(txs.get('firstObject.id'), "53523");
    assert.equal(txs.get('lastObject.id'), "53586");
    
    return txs.nextPage().then(function() {
      assert.equal(txs.get('length'), 20);
      assert.equal(txs.get('firstObject.id'), "53523");
      assert.equal(txs.get('lastObject.id'), "53656");
      
      return txs.nextPage().then(function() {
        assert.equal(txs.get('length'), 30);
        assert.equal(txs.get('firstObject.id'), "53523");
        assert.equal(txs.get('lastObject.id'), "53726");
      });
    });
  });
});

test('loads new data from server', function(assert) {
  var transactions = store.find('transaction')
                        .paginate({pageSize: 10});
  
  return transactions.then(function(txs) {
    return txs.nextPage(3).then(function() {
      assert.equal(txs.get('length'), 10);
      assert.equal(txs.get("firstObject.id"), "53733");
      assert.equal(txs.get("lastObject.id"), "53796");
    });
  });   
});

test('loads full data of pages larger than remote page size', function(assert) {
  var transactions = store.find('transaction')
                        .paginate({pageSize: 67});

  return transactions.then(function(txs) {
    assert.equal(txs.get('length'), 67);
    assert.equal(txs.get("firstObject.id"), "53523");
    assert.equal(txs.get("lastObject.id"), "53985");
    
    return txs.nextPage().then(function() {
      assert.equal(txs.get('length'), 67);
      assert.equal(txs.get("firstObject.id"), "53992");
      assert.equal(txs.get("lastObject.id"), "54454");
    });
  });             
});

test('paginates data queries', function(assert) {
  var transactions = store.find('transaction', {year: 2013, month: 5})
                        .paginate({pageSize: 15});

  return transactions.then(function(txs) {
    assert.equal(txs.get('length'), 15);
    assert.deepEqual(txs.get("firstObject.date"), new Date(2013, 4, 1))
    assert.equal(txs.get("firstObject.id"), "69273");
    assert.equal(txs.get("lastObject.id"), "69371");
  })
});

test("doesn't go before beginning of list", function(assert) {
  var transactions = store.find('transaction')
                        .paginate({pageSize: 10});
  
  var prev = transactions.then(function(txs) {
    assert.equal(txs.get('length'), 10);
    assert.equal(txs.get('firstObject.id'), "53523");
    return txs.prevPage();
  });

  return prev.then(function(txs) {
    assert.equal(txs.get('length'), 10);
    assert.equal(txs.get('firstObject.id'), "53523");
  })
});

test("doesn't go past end of list", function(assert) {
  var transactions = store.find('transaction', {year: 2013, month: 5})
                        .paginate({pageSize: 20});

  var lastPage = transactions.then(function(txs) {
    assert.equal(txs.get('hasNextPage'), true);
    return txs.nextPage(10);
  });

  var afterLastPage = lastPage.then(function(txs) {
    assert.equal(txs.get('hasNextPage'), false);
    assert.equal(txs.get('length'), 17);
    assert.deepEqual(txs.get('firstObject.date'), new Date(2013, 4, 29));
    assert.deepEqual(txs.get('lastObject.date'), new Date(2013, 4, 31));
    return txs.nextPage();
  })
  
  return afterLastPage.then(function(txs) {
    assert.equal(txs.get('hasNextPage'), false);
    assert.equal(txs.get('length'), 17);
    assert.equal(txs.get("firstObject.id"), "70673");
    assert.equal(txs.get("lastObject.id"), "70785");
  })
});