import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  amount: DS.attr('number'),
  date: DS.attr('date'),
  description: DS.attr('string'),
  balance: DS.attr('number'),
  formattedDate: Ember.computed('date', function() {
    var date = this.get('date');
    return "" + (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear()
  })
});
