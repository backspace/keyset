import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  year: DS.attr('number'),
  month: DS.attr('number'),
  transactions: DS.hasMany('transactions', {async: true})
});
