'use strict';

const tagsMap = {
  '聊天': ['聊天'],
  '聊天与贴图': ['聊天', '贴图'],
  null: [],
  '老帖集散中心': ['坟'],
  '机要处': ['站务'],
  '内部板块': ['站务'],
  '函数机综合讨论区': ['函数机'],
  '软件升级': ['软件升级', '函数机'],
  '软件爆机': ['软件爆机', '函数机'],
  '求助': ['求助'],
  '硬升级与硬件讨论': ['硬件', '函数机'],
  '站务管理': ['站务'],
  '音乐/游戏/视频': ['音乐/游戏/视频'],
  '贴图': ['贴图'],
  '其他图形编程计算器': ['图形/编程机'],
  '纯编程、古董': ['纯编程', '古董'],
  'ES编程': ['函数机', '编程'],
  '异常模式': ['函数机', '异常模式'],
  '学生学术讨论': ['讨论', '学术'],
  '资源下载': ['资源', '下载'],
  'fx-9860/9750系列': ['CASIO', 'fx-9860/9750', '图形/编程机'],
  '图形编程计算器资源下载': ['图形/编程机', '资源', '下载'],
  '应用技巧': ['技巧'],
  'ClassPad': ['CASIO', 'ClassPad', '图形/编程机'],
  '卡西欧（CASIO）图形编程计算器': ['CASIO', '图形/编程机'],
  '涵盖多系列资源': ['资源'],
  '计算软件讨论及资源下载': ['计算软件'],
  '硬件爆机': ['硬件爆机', '函数机'],
  'fx-9860/9750': ['CASIO', 'fx-9860/9750', '图形/编程机'],
  '帖子临时存放处': ['论坛缓存区'],
  '89/92/V200': ['TI', '89/92/V200', '图形/编程机'],
  '德州仪器（TI）图形编程计算器': ['TI', '图形/编程机'],
  'Nspire': ['TI', 'Nspire', '图形/编程机'],
  '83/84': ['TI', '83/84', '图形/编程机'],
  '二手&交易': ['二手与交易'],
  'ClassPad系列': ['CASIO', 'ClassPad', '图形/编程机'],
  'TI-Nspire系列': ['TI', 'Nspire', '图形/编程机'],
  'fx-4800P/5800P系列': ['CASIO', 'fx-4800P/5800P', '图形/编程机'],
  'TI-Z80系列': ['TI', 'Z80', '图形/编程机'],
  '教程/引导': ['教程'],
  '工程样品机': ['工程机'],
  '程序/游戏': ['程序与游戏'],
  '视频': ['视频'],
  'fx-CG10/20': ['CASIO', 'fx-CG10/20', '图形/编程机'],
  '讨论': ['讨论'],
  '惠普（HP）图形编程计算器': ['Hewlett Packard', '图形/编程机'],
  'TI-68K系列': ['TI', '68000', '图形/编程机'],
  'DIY计算器讨论': ['DIY计算器'],
  'Lua': ['Lua'],
  'fx-CG10/20系列': ['CASIO', 'fx-CG10/20', '图形/编程机'],
  'ArithMax开源图形计算器项目': ['ArithMax', 'ZephRay'],
  'Lua讨论': ['Lua'],
  'HP系列': ['Hewlett Packard'],
  'SHARP图形机': ['SHARP', '图形/编程机'],
  '新闻': ['新闻'],
  'TI-Nspire': ['TI', 'Nspire', '图形/编程机'],
  'lua讨论': ['Lua'],
  '佳能': ['Canon'],
  'TI-83/84': ['TI', '83/84', '图形/编程机'],
  'HP图形机': ['Hewlett Packard', '图形/编程机'],
  'Palmtop': ['Palmtop'],
  'CG10/20': ['CASIO', 'fx-CG10/20', '图形/编程机'],
  '9860/9750': ['CASIO', 'fx-9860/9750', '图形/编程机'],
  '泛手持计算设备': ['其他手持计算设备'],
  '5800P': ['CASIO', 'fx-4800P/5800P', '图形/编程机'],
  '其他': []
}

function convertThreadAndPost(config, conns) {
  if (!config.threadAndPost.convert) {
    return Promise.resolve();
  } else {
    return new Promise(async (resolve, reject) => {

      function cleanupMongo() {
        if (!config.threadAndPost.cleanup) {
          return Promise.resolve();
        }
        console.log('[ThreadAndPost][Mongo] Deleting all data in discusson.');
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
            'SELECT authorid, subject, dateline, views, replies, tid, ',
            '	      cbs_forum_forum.name as tag1, cbs_forum_threadclass.name as tag2',
            'FROM   cncalc.cbs_forum_thread',
            'left join cbs_forum_forum ',
            '	  on cbs_forum_forum.fid = cbs_forum_thread.fid',
            'left join cbs_forum_threadclass ',
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
          if (!tagsMap[item.tag1]) {
            console.log(item.tag1);
          }
          if (!tagsMap[item.tag2]) {
            console.log(item.tag2);
          }
          obj.title = item.subject;
          obj.lastDate = obj.createDate = item.dateline;
          obj.views = item.views;
          obj.tags = [...new Set([...tagsMap[item.tag1], ...tagsMap[item.tag2]])];
          obj.tid = item.tid;
          obj.status = null; // TODO

          transformed.push(obj);
        });

        return transformed;
      }

      function attachThreadPosts(dataset, uidMap) {
        if (!config.threadAndPost.convertPost) {
          return Promise.resolve(dataset);
        }

        return new Promise((resolve, reject) => {
          console.log('[ThreadAndPost][MySQL] Fetching posts data (it may take some time).')
          let promiseArray = new Array(dataset.length);
          for (let i = 0; i != dataset.length; ++i) {
            promiseArray[i] = new Promise((resolve, reject) => {
              conns.mysql.query({
                sql: 'SELECT * FROM cncalc.cbs_forum_post WHERE tid = ? ORDER BY pid',
                values: [dataset[i].tid],
              }, (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  // Skip 每日签到贴
                  dataset[i].posts = (dataset[i].tid === 10525) ? [] : data.map(post => {
                    return {
                      user: uidMap[post.authorid],
                      createDate: post.dateline,
                      encoding: 'discuz',
                      content: post.message,
                      allowScript: false,
                      votes: [],
                      status: null,
                    };
                  });
                  delete dataset[i].tid;
                  if (dataset[i].posts.length > 0) {
                    dataset[i].lastDate = dataset[i].posts[dataset[i].posts.length - 1].createDate;
                  }
                  resolve();
                }
              })
            });
          }

          Promise.all(promiseArray).then(() => {
            resolve(dataset);
          }).catch(e => {
            reject(e);
          })
        })        
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
        await cleanupMongo();
        let uidMap = await prepareUserData();
        let threadData = await fetchThreadData();
        let dataset = transformThreadData(threadData, uidMap);
        dataset = await attachThreadPosts(dataset, uidMap);
        /*while (dataset.length > 0) {
          let partof = dataset.splice(0, 5000);
          await insertMongo(partof);
        }*/
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
