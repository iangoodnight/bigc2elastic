/**
 *
 * /utils/
 *
 * elasticsearch.utils.test.js
 *
 **/

'use strict';

const {
  formatForDeletion,
  /*  mapBrands,
  parseResponse,
  partitionAndFormatProducts, */
} = require('./elastic.utils');

describe('elasticsearch utils', () => {
  describe('formatForDeletion', () => {
    const data = [
      {
        foo: 'bar',
        baz: 'muz',
        id: 'bc2eP10',
        title: 'Foo',
      },
      {
        title: 'fight',
        bar: 'bix',
        id: 'bc2eP11',
      },
      {
        id: 'bc2eP12A,',
      },
    ];

    const formattedForDeletion = formatForDeletion(data);

    it('should return an array of ids from an array of objects', () => {
      expect(Array.isArray(formattedForDeletion)).toBe(true);

      expect(formattedForDeletion.length).toBe(3);

      for (let i = 0; i < data.length; i++) {
        expect(data[i].id).toBe(formattedForDeletion[i]);
      }
    });
  });
});
