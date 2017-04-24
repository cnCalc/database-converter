'use strict';

function convertPmMessage(config, conns) {
  if (!config.pmMessage.convert) {
    return Promise.resolve();
  } else {
    return new Promise((resolve, reject) => {

      function cleanUpMongo() {
        if (!config.pmMessage.cleanup) {
          return Promise.resolve();
        }
        console.log('[PmMessage][Mongo] Deleting all pm data.');
        return new Promise((resolve, reject) => {
          conns.mongo.collection('mail').deleteMany({}, (err, res) => {
            if (err) {
              reject(err);
            }
            else {
              resolve();
            }
          })
        });
      }

      function fetchPmList(tail) {
        console.log(`[PmMessage][MySQL] Fetching messages from table: cbs_ucenter_pm_messages_${tail}`);
        return new Promise((resolve, reject) => {
          conns.mysql.query(
            `SELECT cbs_ucenter_pm_messages_${tail}.authorid AS sender ` +
            `     , cbs_ucenter_pm_members.uid AS receiver ` +
            `     , cbs_ucenter_pm_messages_${tail}.message ` +
            `     , cbs_ucenter_pm_messages_${tail}.dateline ` +
            `FROM cncalc.cbs_ucenter_pm_messages_${tail} ` +
            `INNER JOIN cncalc.cbs_ucenter_pm_members ` +
            `ON cbs_ucenter_pm_messages_${tail}.plid = cbs_ucenter_pm_members.plid`
          , (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          })
        })
      }

      function prepareUserData() {
        console.log('[PmMessage][Mongo] Fetching user data.');
        return new Promise((resolve, reject) => {
          conns.mongo.collection('common_member').find({}).toArray((err, data) => {
            let userMap = {};
            data.forEach(item => userMap[item.uid] = item._id);
            resolve(userMap);
          })
        });
      }

      cleanUpMongo().then(() => {
        Promise.all([prepareUserData(), ...Array(10).fill(0).map((el, off) => off).map(fetchPmList)])
          .then(values => {
            let uidMap = values.shift();
            let pms = values.reduce((a, b) => [...a, ...b]).filter(el => el.sender !== el.receiver).map(el => {
              return {
                from: {
                  id: uidMap[el.sender],
                  read: true,
                },
                to: {
                  id: uidMap[el.receiver],
                  read: true,
                },
                date: el.dateline,
                content: el.message,
                encoding: 'discuz'
              }
            });
            console.log('[PmMessage][Mongo] Inserting data into MongoDB...');
            conns.mongo.collection('mail').insertMany(pms, (err, res) => {
              if (err) {
                reject(err);
              }
              else {
                resolve();
              }
            });
          })
          .catch(e => reject(e));
      }).catch(e => reject(e));

    });
  }
}

module.exports = convertPmMessage;