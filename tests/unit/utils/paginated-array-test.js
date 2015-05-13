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

/*
TODO: test:
  has next page
  pass query params from initial fetch
*/
test('truncates results to the given page size', function(assert) {
  var done = assert.async();
  
  var transactions = store.findAll('transaction')
                        .paginate({pageSize: 10});
  
  transactions.then(function(txs) {
    assert.equal(txs.get('length'), 10);
    done();
  });                      
});

test('replaces current page with the next page', function(assert) {
  var done = assert.async();
  
  var transactions = store.findAll('transaction')
                        .paginate({pageSize: 10});
  
  transactions.then(function(txs) {
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
  }).then(done);            
});

test('append behavior', function(assert) {
  var done = assert.async();
  
  var transactions = store.findAll('transaction')
                        .paginate({pageSize: 10, behavior: 'append'});
  
  transactions.then(function(txs) {
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
      })
    })
  }).then(done);
});

test('loads new data from server', function(assert) {
  var done = assert.async();
  
  var transactions = store.findAll('transaction')
                        .paginate({pageSize: 10});
  
  transactions.then(function(txs) {
    return txs.nextPage(3).then(function() {
      assert.equal(txs.get('length'), 10);
      assert.equal(txs.get("firstObject.id"), "53733");
      assert.equal(txs.get("lastObject.id"), "53796");
    });
  }).then(done);                    
});

test('loads full data of pages larger than remote page size', function(assert) {
  var done = assert.async();
  
  var transactions = store.findAll('transaction')
                        .paginate({pageSize: 67});
  
  transactions.then(function(txs) {
    assert.equal(txs.get('length'), 67);
    assert.equal(txs.get("firstObject.id"), "53523");
    assert.equal(txs.get("lastObject.id"), "53985");
    
    return txs.nextPage().then(function() {
      assert.equal(txs.get('length'), 67);
      assert.equal(txs.get("firstObject.id"), "53992");
      assert.equal(txs.get("lastObject.id"), "54454");
    });
  }).then(done);                    
});

test('paginates data queries', function(assert) {
  var done = assert.async();
  
  var transactions = store.findAll('transaction', {year: 2013, month: 5})
                        .paginate({pageSize: 15});
                        
  
  transactions.then(function(txs) {
    assert.equal(txs.get('length'), 15);
    assert.equal(txs.get("firstObject.id"), "53523");
    assert.equal(txs.get("lastObject.id"), "53621");
  }).then(done);
})