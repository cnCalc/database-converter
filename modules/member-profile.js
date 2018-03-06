'use strict';

function convertMemberProfile(config, conns) {
  if (!config.memberProfile.convert) {
    return Promise.resolve();
  }
  return new Promise(async (resolve, reject) => {

    function getMemberAvatarUrl (uid) {
      let pad = number => ('000000000' + number.toString()).substr(-9);

      let matchResult = pad(uid).match(/(\d{3})(\d{2})(\d{2})(\d{2})/);
      return `/uploads/avatar/${matchResult[1]}/${matchResult[2]}/${matchResult[3]}/${matchResult[4]}_avatar_big.jpg`;
    }
    

    function fetchMemberData() {
      console.log('[MemberProfile][MySQL] Fetching profiles.');
      return new Promise((resolve, reject) => {
        conns.mysql.query({
          sql:
            'SELECT * FROM cbs_common_member_profile ' + 
            'INNER JOIN cbs_ucenter_members ON ' +
            'cbs_common_member_profile.uid = cbs_ucenter_members.uid' + (config.memberProfile.skipFourZero ? ' WHERE NOT (gender = 0 AND birthyear = 0 AND birthmonth = 0 AND birthday = 0)' : '') + ' LIMIT 0,18446744073709551615',
        }, (err, res) => {
          if (err) reject(err);
          else resolve(res);
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
          sql:
            'SELECT * FROM cbs_common_member_profile_archive ' + 
            'INNER JOIN cbs_ucenter_members ON ' +
            'cbs_common_member_profile_archive.uid = cbs_ucenter_members.uid' + (config.memberProfile.skipFourZero ? ' WHERE NOT (gender = 0 AND birthyear = 0 AND birthmonth = 0 AND birthday = 0)' : '') + ' LIMIT 0,18446744073709551615',
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
          });
          typeof row['constellation'] !== 'undefined' && delete row['constellation'];
          typeof row['zodiac'] !== 'undefined' && delete row['zodiac'];
          row['device'] = row['field1'];
          delete row['field1'];
          row['credentials'] = {
            password: row['password'],
            type: 'discuz',
            salt: row['salt'],
          }
          delete row['password'];
          delete row['salt'];
          row.attachment = [];
        });
        resolve(data);
      });
    }

    function cleanupMongo() {
      if (!config.memberProfile.cleanup) {
        return Promise.resolve();
      }
      console.log('[MemberProfile][Mongo] Deleting all data in common_member.');
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
        console.log('[MemberProfile][Mongo] Inserting data into MongoDB...');
        conns.mongo.collection('common_member').insertMany(data, (err, res) => {
          if (err) {
            reject(err);
          }
          else {
            resolve()
          }
        });
      });
    }

    try {
      await cleanupMongo();
      let resSet = (await fetchMemberData()).concat(await fetchArchviedMemberData());
      resSet = await removeEmptyFileds(resSet);
      resSet = [
        {
          "uid" : 0,
          "username": 'QQ 用户',
          "credentials": {
            type: "banned"
          }
        },
        ...resSet
      ]
      resSet.forEach(profile => {
        const path = getMemberAvatarUrl(profile.uid);
        profile.avatar = require('fs').existsSync(require('path').join(config.memberProfile.assetPath, path)) ? path : null;
        if (profile.regdate) profile.regdate *= 1000;
        if (profile.lastlogintime) profile.lastlogintime *= 1000;
      });
      await insertMongo(resSet);
      resolve();
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

module.exports = convertMemberProfile;
