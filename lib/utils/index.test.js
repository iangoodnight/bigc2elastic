/**
 *
 * /utils/
 *
 * index.test.js
 *
 **/

'use strict';

const utils = require('./index');

describe('/utils/ index.js', () => {
  it('should import utils correctly', () => {
    const keys = Object.keys(utils);

    expect(utils).toBeDefined();

    expect(keys.length).toBe(2);

    const { bigC, elastic } = utils;

    const bigCKeys = Object.keys(bigC);

    const elasticKeys = Object.keys(elastic);

    expect(bigCKeys.length).toBe(2);

    expect(elasticKeys.length).toBe(4);

    const bigCFunctions = ['formatCategory', 'partitionAndFormat'];

    const elasticFunctions = [
      'formatForDeletion',
      'mapBrands',
      'parseResponse',
      'partitionAndFormatProducts',
    ];

    for (const key of bigCKeys) {
      expect(typeof bigC[key]).toBe('function');

      expect(bigCFunctions.indexOf(bigC[key].name)).not.toBe(-1);
    }

    for (const key of elasticKeys) {
      expect(typeof elastic[key]).toBe('function');

      expect(elasticFunctions.indexOf(elastic[key].name)).not.toBe(-1);
    }
  });
});
