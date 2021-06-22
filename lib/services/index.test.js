/**
 *
 * /services/
 *
 * index.test.js
 *
 **/

'use strict';

describe('/services/ index.js', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should import utils correctly', () => {
    process.env.NODE_ENV = 'production';
    const services = require('./index');

    const keys = Object.keys(services);

    expect(services).toBeDefined();

    expect(keys.length).toBe(2);

    const { bigC, elastic } = services;

    const bigCKeys = Object.keys(bigC);

    const elasticKeys = Object.keys(elastic);

    expect(bigCKeys.length).toBe(3);

    expect(elasticKeys.length).toBe(3);

    const bigCFunctions = ['listCategories', 'fetchBrands', 'fetchProducts'];

    const elasticFunctions = [
      'fetchDocuments',
      'postDocuments',
      'deleteDocuments',
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

  it('should export private functions for testing', () => {
    process.env.NODE_ENV = 'test';
    const services = require('./index');

    const { bigC, elastic } = services;

    const bigCKeys = Object.keys(bigC);

    const elasticKeys = Object.keys(elastic);

    expect(bigCKeys.length).toBe(5);

    expect(elasticKeys.length).toBe(5);

    const bigCFunctions = [
      'listCategories',
      'fetchBrands',
      'fetchProducts',
      'generateBigCHeaders',
      'returnUrl',
    ];

    const elasticFunctions = [
      'fetchDocuments',
      'postDocuments',
      'deleteDocuments',
      'generateElasticConfig',
      'returnElasticEndPoint',
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
