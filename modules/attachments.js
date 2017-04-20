'use strict';

function convertAttachments(config, conns) {
  if (!config.attachment.convert) {
    return Promise.resolve();
  } else {
    return new Promise((resolve, reject) => {

      function fetchAttachments(tail) {
        console.log(`[Attachments][Mongo] Fetching attachments from table: cbs_forum_attachment_${tail}.`);
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


      Promise.all([prepareUserData(), ...Array(10).fill(0).map((el, off) => off).concat('unused').map(fetchAttachments)])
        .then(values => {
          let uidMap = values.shift();
          let attachments = values.reduce((a, b) => [...Array.from(a), ...Array.from(b)]).map(row => {
            return {
              uploader: uidMap[row.uid],
              date: row.dateline,
              filename: row.filename,
              path: row.attachment,
              downloadCount: row.downloads,
            }
          });
          console.log('[Attachments][Mongo] Inserting data into MongoDB...');
          conns.mongo.collection('attachment').insertMany(attachments, (err, res) => {
            if (err) {
              reject(err);
            }
            else {
              resolve();
            }
          });
        })
        .catch(err => {
          console.log(err)
          reject(err);
        });

    });
  }
}

module.exports = convertAttachments;
