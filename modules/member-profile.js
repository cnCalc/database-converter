'use strict';

function convertMemberProfile(config, conns) {
  if (!config.memberProfile.convert) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {

    function fetchMemberData() {
      console.log('[MemberProfile][MySQL] Fetching profiles.');
      return new Promise((resolve, reject) => {
        conns.mysql.query({
          sql: 'SELECT * FROM cbs_common_member_profile' + (config.memberProfile.skipFourZero ? ' WHERE NOT (gender = 0 AND birthyear = 0 AND birthmonth = 0 AND birthday = 0)' : ''),
        }, (err, res) => {
          if (err) reject(err);
          else     resolve(res);
        });
      })
    }

    function fetchArchviedMemberData() {
      if (config.memberProfile.skipArchiveTable) {
        return Promise.resolve([]);
      }
      console.log('[MemberProfile][MySQL] Fetching archvied profiles.');
      return new Promise((resolve, reject) => {
        conns.mysql.query({
          sql: 'SELECT * FROM cbs_common_member_profile_archive' + (config.memberProfile.skipFourZero ? ' WHERE NOT (gender = 0 AND birthyear = 0 AND birthmonth = 0 AND birthday = 0)' : ''),
        }, (err, res) => {
          if (err)
            reject(err);
          else
            resolve(res);
        });
      })
    }

    function removeEmptyFileds(data) {
      console.log('[MemberProfile][undef] Deleting all empty fileds in member profile...');
      return new Promise((resolve, reject) => {
        data.forEach(row => {
          Object.keys(row).forEach(key => {
            if (row[key] == '')
              delete row[key];
          })
        });
        resolve(data);
      });
    }

    function cleanupMongo() {
      if (!config.memberProfile.cleanup) {
        return Promise.resolve();
      }
      console.log('[MemberProfile][MongoDB] Deleting all data in common_member.');
      return new Promise((resolve, reject) => {
        conns.mongo.collection('common_member').deleteMany({}, (err, res) => {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
        })
      })
    }

    function insertMongo(data) {
      return new Promise((resolve, reject) => {
        console.log('[MemberProfile][MongoDB] Inserting data into MongoDB...');
        conns.mongo.collection('common_member').insertMany(data, (err, res) => {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
        });
      });
    }

    cleanupMongo().then(() => {
      return Promise.all([fetchMemberData(), fetchArchviedMemberData()])
    }).then(values => {
      return removeEmptyFileds(values.reduce((a, b) => a.concat(b)));
    }).then(value => {
      return insertMongo(value);
    }).then(() => {
      resolve();
    }).catch(err => {
      console.log(err);
    })
  });
}

module.exports = convertMemberProfile;