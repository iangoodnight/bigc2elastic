/**
 *
 * /utils/
 *
 * bigcommerce.utils.js
 *
 **/

'use strict';

function formatCategory(category = {}) {
  const {
    custom_url: { url },
    description,
    id: rawId,
    is_visible,
    meta_description,
    name,
    search_keywords,
  } = category;

  const id = `baC${rawId}`;

  const formatted = {
    description,
    id,
    meta_description,
    name,
    search_keywords,
    url,
  };

  if (is_visible) return [ is_visible, formatted ];
  return [ false, { id } ];
}

module.exports = {
  partitionAndFormat: (data = []) => {
    return data.reduce(([active, inactive], category) => {
      const [ isVisible, formatted ] = formatCategory(category);
      return isVisible ? [[...active, formatted], inactive] :
        [active, [...inactive, formatted]];
    }, [[],[]]);
  },
}
