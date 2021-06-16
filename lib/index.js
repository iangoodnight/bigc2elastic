#!/usr/bin/env node

/**
 * bigC2elastic
 * index.js
 **/

'use strict';

const chalk = require('chalk');

const {
  bigC: { listCategories, fetchProducts },
  elastic: { fetchDocuments, deleteDocuments, postDocuments },
} = require('./services');

const {
  bigC: { partitionAndFormat },
  elastic: { formatForDeletion, parseResponse, partitionAndFormatProducts },
} = require('./utils');

const { log, time, timeEnd } = console;

require('dotenv').config();

const [, , ...flags] = process.argv;

const ONLY_PRODUCTS = flags.indexOf('--products-only') !== -1;

const DROP = flags.indexOf('--drop') !== -1;

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

  if (!ONLY_PRODUCTS) {
    const [, hiddenCategories] = partitionAndFormat(categoryResponse);

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
      categoryResponse
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
