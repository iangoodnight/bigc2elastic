#!/usr/bin/env node

/**
 * bigC2elastic
 * index.js
 **/

'use strict';

const chalk = require('chalk');

const {
  bigC: { listCategories, fetchBrands, fetchProducts },
  elastic: { fetchDocuments, deleteDocuments, postDocuments },
} = require('./services');

const {
  bigC: { partitionAndFormat },
  elastic: {
    formatForDeletion,
    mapBrands,
    parseResponse,
    partitionAndFormatProducts,
  },
} = require('./utils');

const { log, time, timeEnd } = console;

require('dotenv').config();

const [, , ...flags] = process.argv;

const ONLY_PRODUCTS = flags.indexOf('--products-only') !== -1;

const DROP = flags.indexOf('--drop') !== -1;

const NO_BRANDS = flags.indexOf('--no-brands') !== -1;

const NO_CATEGORIES = flags.indexOf('--no-categories') !== -1;

async function run() {
  const processLabel = 'Elasticsearch Sync';

  let functionLabel;

  time(processLabel);

  log(chalk.blue('Starting sync...'));

  if (DROP) {
    const iterator = fetchDocuments();

    let ids = [];

    functionLabel = 'Dropped existing documents';

    time(functionLabel);
    log(chalk.magenta('Drop requested...'));

    let docPage = 1;

    for await (const page of iterator) {
      log(chalk.magenta(`Fetching page ${docPage}`));
      for (const doc of page) {
        const { id, name } = doc;
        ids.push({ id, name });
      }
      docPage++;
    }

    while (ids.length > 0) {
      const hundredDocs = ids.splice(0, 100);

      log(chalk.magenta('Dropping in batches of 100'));

      const { data: dropResponse } = await deleteDocuments(
        formatForDeletion(hundredDocs)
      );

      const [runner, result, ...rest] = parseResponse(
        dropResponse,
        hundredDocs
      );

      log(chalk.magenta(runner));
      log(chalk.green(result));

      for (const exception of rest) {
        log(chalk.yellow(exception));
      }
    }

    timeEnd(functionLabel);
  }

  functionLabel = 'Fetch categories';

  time(functionLabel);

  log(chalk.magenta('Fetching categories from BigC...'));

  const categoryResponse = await listCategories();

  timeEnd(functionLabel);

  if (!ONLY_PRODUCTS && !NO_CATEGORIES) {
    let [visibleCategories, hiddenCategories] =
      partitionAndFormat(categoryResponse);

    log(chalk.magenta('Deleting hidden categories...'));

    functionLabel = 'Deleted hidden categories';

    time(functionLabel);

    const { data: deleteCategoryResponse } = await deleteDocuments(
      formatForDeletion(hiddenCategories)
    );

    const [runner, result, ...rest] = parseResponse(
      deleteCategoryResponse,
      hiddenCategories
    );

    log(chalk.magenta(runner));
    log(chalk.green(result));

    for (const unDeleted of rest) {
      log(chalk.yellow(unDeleted));
    }

    timeEnd(functionLabel);

    functionLabel = 'Updated categories';

    time(functionLabel);

    log(chalk.magenta('Updating categories'));

    while (visibleCategories.length > 0) {
      if (visibleCategories.length > 100) {
        const firstHundredCategories = visibleCategories.splice(0, 100);

        const { data: postedCategories = [] } = await postDocuments(
          firstHundredCategories
        );

        const [categoryRunner, updatedResult, ...rest] = parseResponse(
          postedCategories,
          firstHundredCategories
        );

        log(chalk.magenta(categoryRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }
      } else {
        const { data: postedCategories = [] } = await postDocuments(
          visibleCategories
        );

        const [categoryRunner, updatedResult, ...rest] = parseResponse(
          postedCategories,
          visibleCategories
        );
        log(chalk.magenta(categoryRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }

        visibleCategories.length = 0;
      }
    }

    timeEnd(functionLabel);
  }

  functionLabel = 'Fetch brands';

  time(functionLabel);

  log(chalk.magenta('Mapping brands'));

  let brandPages = 0;
  const brandIterator = fetchBrands();

  const brandArray = [];

  for await (const brandPage of brandIterator) {
    brandPages++;

    log(chalk.blue(`Page: ${brandPages}`));

    brandArray.push(...brandPage);
  }

  const brandKey = mapBrands(brandArray);

  timeEnd(functionLabel);

  if (!ONLY_PRODUCTS && !NO_BRANDS) {
    functionLabel = 'Updating brands';

    time(functionLabel);

    let formattedBrands = brandKey.map((brand) => {
      const formatted = { ...brand };
      formatted.id = 'bc2eB' + brand.id;
      return formatted;
    });

    while (formattedBrands.length > 0) {
      if (formattedBrands.length > 100) {
        const firstHundredBrands = formattedBrands.splice(0, 100);

        const { data: postedBrands = [] } = await postDocuments(
          firstHundredBrands
        );

        const [brandRunner, updatedResult, ...rest] = parseResponse(
          postedBrands,
          firstHundredBrands
        );

        log(chalk.magenta(brandRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }
      } else {
        const { data: postedBrands = [] } = await postDocuments(
          formattedBrands
        );

        const [brandRunner, updatedResult, ...rest] = parseResponse(
          postedBrands,
          formattedBrands
        );

        log(chalk.magenta(brandRunner));
        log(chalk.green(updatedResult));

        for (const remaining of rest) {
          log(chalk.yellow(remaining));
        }

        formattedBrands.length = 0;
      }
    }

    timeEnd(functionLabel);
  }

  log(chalk.magenta('Fetching product pages'));

  functionLabel = 'Fetched product pages';

  let totalPages = 0;
  const iterator = fetchProducts();

  for await (const page of iterator) {
    totalPages++;

    log(chalk.blue(`Page: ${totalPages}`));

    const [toUpdate, toDelete] = partitionAndFormatProducts(
      page,
      categoryResponse,
      brandKey
    );

    let localLabel = 'Deleted hidden products';
    log(chalk.magenta('Deleting hidden products...'));

    time(localLabel);

    const { data: deleteProductsResponse = [] } = await deleteDocuments(
      formatForDeletion(toDelete)
    );

    const [deletedRunner, deletedResult, ...deletedRest] = parseResponse(
      deleteProductsResponse,
      toDelete
    );

    log(chalk.magenta(deletedRunner));
    log(chalk.green(deletedResult));

    for (const unDeleted of deletedRest) {
      log(chalk.yellow(unDeleted));
    }

    timeEnd(localLabel);

    localLabel = 'Updated products';
    log(chalk.magenta('Updating products'));

    time(localLabel);

    const { data: postedDocuments = [] } = await postDocuments(toUpdate);

    const [updatedRunner, updatedResult, ...updatedRest] = parseResponse(
      postedDocuments,
      toUpdate
    );

    log(chalk.magenta(updatedRunner));
    log(chalk.green(updatedResult));

    for (const remaining of updatedRest) {
      log(chalk.yellow(remaining));
    }

    timeEnd(localLabel);
  }

  log(chalk.blue('Finished'));
  timeEnd(processLabel);
}

run();
