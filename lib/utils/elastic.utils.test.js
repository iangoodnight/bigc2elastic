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
  mapBrands,
  parseResponse,
  partitionAndFormatProducts,
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

  describe('mapBrands', () => {
    const testBrand = [
      {
        custom_url: { url: '/foo/bar' },
        id: 11,
        meta_description: 'A foo for all bar',
        meta_keywords: ['foo', 'bar', 'baz'],
        name: 'Foobar',
        page_title: 'Foo | Bar',
        search_keywords: 'foo bar baz',
        noise: 'brap',
        garbo: 'zup',
      },
    ];

    const brandMap = mapBrands(testBrand);

    const [brand] = brandMap;

    const keys = Object.keys(brand);

    it('should return brands formatted for ingestion', () => {
      expect(Array.isArray(brandMap)).toBe(true);

      expect(brand.bucket).toBeDefined();

      expect(brand.bucket).toBe('brand');

      expect(brand.noise).not.toBeDefined();

      expect(brand.garbo).not.toBeDefined();

      expect(keys.length).toBe(8);

      for (const key of keys) {
        expect(brand[key]).toBeDefined();
      }
    });
  });

  describe('parseResponse', () => {
    const key = [
      {
        id: 'foo1',
        name: 'Goliath',
      },
      {
        id: 'foo2',
        name: 'Leviathan',
      },
    ];

    const postResponse = [
      {
        id: 'foo1',
        errors: [],
      },
      {
        id: 'foo2',
        errors: ['I cannot go for that'],
      },
    ];

    const parsedPost = parseResponse(postResponse, key);

    const deleteResponse = [
      {
        id: 'foo1',
        deleted: true,
      },
      {
        id: 'foo2',
        deleted: false,
      },
    ];

    const parsedDelete = parseResponse(deleteResponse, key);

    it('should correctly parse and return post responses', () => {
      expect(Array.isArray(parsedPost)).toBe(true);

      const [runner, result, ...rest] = parsedPost;

      expect(runner).toBe('Attempted 2 operations...');

      expect(result).toBe('1 documents successfully updated');

      expect(rest.length).toBe(1);

      expect(rest[0]).toBe('Failed to update foo2: Leviathan');
    });

    it('should correctly parse and return delete response', () => {
      expect(Array.isArray(parsedDelete)).toBe(true);

      const [runner, result, ...rest] = parsedDelete;

      expect(runner).toBe('Attempted 2 operations...');

      expect(result).toBe('1 documents successfully updated');

      expect(rest.length).toBe(1);

      expect(rest[0]).toBe('Failed to update foo2: Leviathan');
    });

    it('should omit the name if the key fails', () => {
      const badKey = [{}];

      const badParse = parseResponse(deleteResponse, badKey);

      expect(Array.isArray(badParse)).toBe(true);

      const [runner, result, ...rest] = badParse;

      expect(runner).toBe('Attempted 2 operations...');

      expect(result).toBe('1 documents successfully updated');

      expect(rest.length).toBe(1);

      expect(rest[0]).toBe('Failed to update foo2');
    });
  });

  describe('partitionAndFormatProducts', () => {
    function Product(id, is_visible) {
      this.brand_id = 11;
      this.calculated_price = 2;
      this.categories = [12];
      this.custom_url = { url: '/foo/bar' };
      this.date_created = '1999-12-31';
      this.date_modified = '2021-6-19';
      this.description = `Foo - ${id}`;
      this.gtin = '123456';
      this.id = id;
      this.is_featured = false;
      this.is_visible = is_visible;
      this.meta_description = 'Meta foo';
      this.meta_keywords = ['No on uses meta keywords'];
      this.mpn = '100-100-101';
      this.name = 'Foo';
      this.page_title = 'Foo | Bar';
      this.price = 100;
      this.search_keywords = 'foo bar';
      this.sort_order = 1;
      this.total_sold = 100;
      this.upc = '123456789';
      this.view_count = 0;
    }

    const visibleProduct = new Product('foo1', true);

    const hiddenProduct = new Product('foo2', false);

    const categoryKey = [{ id: 12, name: 'Category' }];

    const brandKey = [{ id: 11, name: 'Brand' }];

    it('should partition and format products by `is_visible`', () => {
      const [visible, hidden] = partitionAndFormatProducts(
        [hiddenProduct, visibleProduct],
        categoryKey,
        brandKey
      );

      const visibleKeys = Object.keys(visible[0]);

      const hiddenKeys = Object.keys(hidden[0]);

      const [testProduct] = visible;

      expect(Array.isArray(visible) && Array.isArray(hidden)).toBe(true);

      expect(visibleKeys.length).toBe(22);

      expect(hiddenKeys.length).toBe(2);

      expect(hidden[0].id).toBe('bc2ePfoo2');

      expect(hidden[0].name).toBe('Foo');

      expect(testProduct.id).toBe('bc2ePfoo1');

      expect(testProduct.brand).toBe('Brand');

      expect(testProduct.categories.indexOf('Category')).not.toBe(-1);

      expect(testProduct.bucket).toBe('product');

      for (const key of visibleKeys) {
        expect(testProduct[key]).toBeDefined();
      }

      const badProduct = { is_visible: true, brand_id: 21, categories: [6] };

      const [testDefault] = partitionAndFormatProducts(
        [badProduct],
        categoryKey,
        brandKey
      );

      const [defaults] = testDefault;

      const defaultKeys = Object.keys(defaults);

      expect(defaultKeys.length).toBe(22);

      expect(defaults.brand).toBe(21);

      expect(defaults.categories).toStrictEqual([6]);

      for (const key of defaultKeys) {
        expect(defaults[key]).toBeDefined();
      }
    });
  });
});
