
module.exports = function(app) {
  var fs = require('fs');
  var express = require('express');
  var _ = require('underscore')
  var transactionsRouter = express.Router();

  //transactions are sorted by ID
  var allTransactions = fs.readFileSync(__dirname +"/transactions.csv").toString("utf-8").split("\n").map(function(tx) {
    var row = tx.split(",");
    return {
      id: row[0],
      amount: row[1],
      date: row[2],
      description: row[3],
      balance: row[4]
    }
  })
  
  function Cursor(props) {
    // If populated, the item at locationKey should _not_ be included in results for this page.
    // if location is null, direction will always be asc
    _.extend(this, {pageSize: 20, direction: "asc"}, props)
  }
  
  Cursor.prototype.next = function(currentPage) {
    var location = _.last(currentPage)[this.key];
    return new Cursor(_.extend({}, this, {location: location, direction: "asc"}))
  }
  
  Cursor.prototype.prev = function(currentPage) {
    var location = _.first(currentPage)[this.key];
    return new Cursor(_.extend({}, this, {location: location, direction: "desc"}))
  }
  
  Cursor.prototype.serialize = function(currentPage, req) {
    return {
      next: JSON.stringify(this.next(currentPage)),
      prev: JSON.stringify(this.prev(currentPage))
    }
  }
  
  transactionsRouter.get('/', function(req, res) {
    var cursor = new Cursor({key: "id", pageSize: 20});
    if (req.query.cursor) {
      cursor = new Cursor(JSON.parse(req.query.cursor))
    }
    
    var transactions = allTransactions.filter(function(tx) {
      if (!cursor.location) {
        return true;
      }
      return cursor.direction == "asc"? tx.id > cursor.location : tx.id < cursor.location
    });
    
    if (cursor.direction == 'asc') {
      transactions = transactions.slice(0, cursor.pageSize)
    } else {
      transactions = transactions.slice(-cursor.pageSize)
    }
    
    res.send({
      'transactions': transactions,
      'meta' : {
        cursor: cursor.serialize(transactions, req)
      }
    });
  });

  transactionsRouter.get('/:id', function(req, res) {
    res.send({
      'transactions': allTransactions.filter(function(tx) { return tx.id === req.params.id})
    });
  });
  
  app.use('/api/transactions', transactionsRouter);
};
