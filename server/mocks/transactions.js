
module.exports = function(app) {
  var fs = require('fs');
  var express = require('express');
  var transactionsRouter = express.Router();

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
  
  transactionsRouter.get('/', function(req, res) {
    res.send({
      'transactions': allTransactions
    });
  });

  transactionsRouter.get('/:id', function(req, res) {
    res.send({
      'transactions': allTransactions.filter(function(tx) { return tx.id === req.params.id})
    });
  });
  
  app.use('/api/transactions', transactionsRouter);
};
