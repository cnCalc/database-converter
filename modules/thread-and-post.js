'use strict';

const ObjectID = require('mongodb')

function convertThreadAndPost(config, conns) {
  if (!config.threadAndPost.convert) {
    return Promise.resolve();
  } else {
    return new Promise(async (resolve, reject) => {

      function cleanupMongo() {
        if (!config.threadAndPost.cleanup) {
          return Promise.resolve();
        }
        console.log('[ThreadAndPost][Mongo] Deleting all data in common_member.');
        return new Promise((resolve, reject) => {
          conns.mongo.collection('discussion').deleteMany({}, (err, res) => {
            if (err) {
              reject(err);
            }
            else {
              resolve();
            }
          })
        })
      }

      function prepareUserData() {
        console.log('[ThreadAndPost][Mongo] Fetching user data.');
        return new Promise((resolve, reject) => {
          conns.mongo.collection('common_member').find({}).toArray((err, data) => {
            let userMap = {};
            data.forEach(item => userMap[item.uid] = item._id);
            resolve(userMap);
          })
        });
      }

      function prepareForumType() {
        console.log('[ThreadAndPost][MySQL] Fetching forum type. ');
        return new Promise((resolve, reject) => {
          conns.mysql.query('SELECT fid, name FROM cbs_forum_forum', (err, data) => {
            if (err) {
              reject(err);
            } else {
              let res = {};
              data.forEach(item => res[item.fid] = item.name);
              resolve(res);
            }
          });
        });
      }

      function fetchThreadData() {
        console.log('[ThreadAndPost][MySQL] Fetching thread data.');
        return new Promise((resolve, reject) => {
          conns.mysql.query([
            'SELECT authorid, subject, dateline, views, replies,',
            '	      cbs_forum_forum.name as tag1, cbs_forum_threadclass.name as tag2',
            'FROM   cncalc.cbs_forum_thread',
            'inner join cbs_forum_forum ',
            '	  on cbs_forum_forum.fid = cbs_forum_thread.fid',
            'inner join cbs_forum_threadclass ',
            '	  on cbs_forum_threadclass.typeid = cbs_forum_thread.typeid',
          ].join(' '), (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      }

      function transformThreadData(threadData, uidMap) {
        console.log('[ThreadAndPost][undef] Reformating data.');
        let transformed = [];
        let warned = [];

        threadData.forEach(item => {
          let obj = {};
          if (uidMap[item.authorid]) {
            obj.creater = uidMap[item.authorid];
          } else if (warned.indexOf(item.authorid) < 0) {
            obj.creater = null;
            console.log('[WARN] Unknown author id: ' + item.authorid + '. Maybe a deleted spammer?');
            warned.push(item.authorid)
          }
          obj.title = item.subject;
          obj.date = item.dateline;
          obj.views = item.views;
          obj.tags = [item.tag1, item.tag2];
          obj.votes = [],
          obj.state = null; // TODO
          transformed.push(obj);
        });

        return transformed;
      }

      function insertMongo(data) {
        return new Promise((resolve, reject) => {
          console.log('[ThreadAndPost][Mongo] Inserting data into MongoDB...');
          conns.mongo.collection('discussion').insertMany(data, (err, res) => {
            if (err) {
              reject(err);
            }
            else {
              resolve();
            }
          });
        });
      }

      try {
        let uidMap = await prepareUserData();
        let threadData = await fetchThreadData();
        let dataset = transformThreadData(threadData, uidMap);
        await insertMongo(dataset);
        resolve();
      } catch (e) {
        console.log(e);
        reject();
      }
    })
  }
}

module.exports = convertThreadAndPost;