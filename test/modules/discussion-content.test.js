'use strict';

const { expect } = require('chai');
const config = require('../../config');
const { MongoClient } = require('mongodb');

const convertDiscussionContent = require('../../modules/discussion-content.js');

describe('test: convert discussion content.', () => {
  let conns = {};
  before(() => {
    return new Promise((resolve, reject) => {
      MongoClient.connect(config.mongo.url, (err, db) => {
        conns.mongo = db;
        resolve();
      });
    })
  });

  it('start test.', () => {
    return convertDiscussionContent(config, conns);
  });

  after(() => {
    conns.mongo.close();
  });

});