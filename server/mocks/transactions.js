
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
    _.extend(this, {pageSize: 20}, props)
  }
  
  Cursor.prototype.next = function(currentPage) {
    if (!currentPage.length) {
      return null;
    }
    var location = _.last(currentPage)[this.key];
    return new Cursor(_.extend({}, this, {location: location}))
  }
  
  Cursor.prototype.serialize = function(currentPage, req) {
    var next = this.next(currentPage);
    return {
      next: next && JSON.stringify(next)
    }
  }
  
  transactionsRouter.get('/', function(req, res) {
    var cursor = new Cursor({key: "id", pageSize: 20});
    if (req.query.cursor) {
      cursor = new Cursor(JSON.parse(req.query.cursor))
    }
    
    var transactions = allTransactions;
    if (req.query.year) {
      transactions = transactions.filter(function(tx) { return tx.date.indexOf("/" +req.query.year) > 0})
    }
    if (req.query.month) {
      transactions = transactions.filter(function(tx) { return tx.date.indexOf(req.query.month + "/") == 0})
    }
    var transactions = transactions.filter(function(tx) {
      if (!cursor.location) {
        return true;
      }
      return  tx.id > cursor.location
    }).slice(0, cursor.pageSize);
    
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
