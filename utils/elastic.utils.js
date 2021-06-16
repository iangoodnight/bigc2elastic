/**
 *
 * /utils/
 *
 * elastic.utils.js
 *
 **/

'use strict';

module.exports = {
  formatForDeletion: (docs) => {
    return docs.map((doc) => doc.id);
  },
  parseResponse: (response, key = []) => {
    const [success, errors] = response.reduce(
      ([success, errors], obj) => {
        const { deleted = undefined, errors: errs } = obj;
        if (deleted) return [[...success, obj], [...errors]];
        if (errs && errs.length === 0) return [[...success, obj], [...errors]];
        return [[...success], [...errors, obj]];
      },
      [[], []]
    );
    const message = [
      `Attempted ${response.length} operations...`,
      `${success.length} documents successfully updated`,
    ];
    errors.forEach((err) => {
      const { id } = err;

      const { name = undefined } = key.find((obj) => obj.id === id);

      const msg = `Failed to update ${name ? id + ': ' + name : id}`;

      message.push(msg);
    });

    return message;
  },
  partitionAndFormatProducts: (products = [{}], categoryKey = [{}]) => {
    return products.reduce(
      ([toUpdate, toDelete], product) => {
        const {
          categories: categoriesRaw = [],
          custom_url: { url = '' },
          description = '',
          id: rawId = '',
          is_visible = false,
          meta_description = '',
          name = '',
          price = '',
          search_keywords = '',
        } = product;

        const id = `baP${rawId}`;

        if (!is_visible) return [[...toUpdate], [...toDelete, { id, name }]];

        const categories = categoriesRaw.map((cat) => {
          const { name } = categoryKey.find((key) => key.id === cat) || cat;
          return name;
        });

        const formatted = {
          categories,
          url,
          description,
          id,
          meta_description,
          name,
          price,
          search_keywords,
        };

        return [[...toUpdate, formatted], [...toDelete]];
      },
      [[], []]
    );
  },
};
