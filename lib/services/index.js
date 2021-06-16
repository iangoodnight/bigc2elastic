/**
 *
 * /services/
 *
 * index.js
 *
 **/

'use strict';

module.exports = {
  // bigcommerce API calls
  bigC: require('./bigcommerce.service'),
  // elasticsearch API calls
  elastic: require('./elasticsearch.service'),
};
