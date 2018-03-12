'use strict';
const { ObjectId } = require('mongodb');

function convertAttachments(config, conns) {
  if (!config.attachment.convert) {
    return Promise.resolve();
  } else {
    return new Promise((resolve, reject) => {

      function cleanupMongo() {
        if (!config.threadAndPost.cleanup) {
          return Promise.resolve();
        }
        console.log('[Attachments][Mongo] Deleting all data in attachment.');
        return new Promise((resolve, reject) => {
          conns.mongo.collection('attachment').deleteMany({}, (err, res) => {
            if (err) {
              reject(err);
            }
            else {
              resolve();
            }
          })
        })
      }

      function fetchAttachments(tail) {
        console.log(`[Attachments][MySQL] Fetching attachments from table: cbs_forum_attachment_${tail}.`);
        return new Promise((resolve, reject) => {
          conns.mysql.query({
            sql:
              `SELECT cbs_forum_attachment_${tail}.*, cbs_forum_attachment.downloads ` +
              `FROM cncalc.cbs_forum_attachment_${tail} ` +
              `INNER JOIN cncalc.cbs_forum_attachment ` +
              `ON cncalc.cbs_forum_attachment.aid = cncalc.cbs_forum_attachment_${tail}.aid`
          }, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          })
        });
      }

      function prepareUserData() {
        console.log('[Attachments][Mongo] Fetching user data.');
        return new Promise((resolve, reject) => {
          conns.mongo.collection('common_member').find({}).toArray((err, data) => {
            let userMap = {};
            data.forEach(item => userMap[item.uid] = item._id);
            resolve(userMap);
          })
        });
      }

      cleanupMongo().then(async () => {
        let values = await Promise.all([prepareUserData(), ...Array(10).fill(0).map((el, off) => off).concat('unused').map(fetchAttachments)]);
        let uidMap = values.shift();
        let update = {};
        let attachments = values.reduce((a, b) => [...Array.from(a), ...Array.from(b)]);
        // .map(row => {
        //   return {
        //     aid: row.aid,
        //     uid: row.uid,
        //     originalName: row.filename,
        //     fileName: row.attachment,
        //     size: -1,
        //     downloadCount: row.downloads,
        //   }
        // });
        console.log('[Attachments][Mongo] Inserting data into MongoDB...');
        for (let attachment of attachments) {
          let r = await conns.mongo.collection('common_member').updateOne(
            { _id: uidMap[attachment.uid] },
            {
              $push: {
                attachments: {
                  _id: ObjectId(),
                  pid: attachment.pid,
                  aid: attachment.aid,
                  originalName: attachment.filename,
                  fileName: attachment.attachment,
                  size: -1,
                  referer: [],
                }
              }
            }
          );
        }
        
        resolve();
      });
    });
  }
}

module.exports = convertAttachments;
