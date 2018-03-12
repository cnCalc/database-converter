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

const categoriesMap = {
  "其他图形编程计算器": "其他图形计算器",
  "图形编程计算器资源下载": "图形计算器资源下载",
  "卡西欧（CASIO）图形编程计算器": "卡西欧（CASIO）图形计算器",
  "德州仪器（TI）图形编程计算器": "德州仪器（TI）图形计算器",
  "惠普（HP）图形编程计算器": "惠普（HP）图形计算器",
  "ArithMax开源图形计算器项目": "ArithMax开源计算器项目"
}

const contentConverter = require('./discussion-content');
const { ObjectId } = require('mongodb');

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
            data.forEach(item => userMap[item.uid] = item);
            resolve(userMap);
          })
        });
      }

      function prepareAttachmentData(uidMap) {
        console.log('[ThreadAndPost][Mongo] Fetching attachment data.');
        return new Promise((resolve, reject) => {
          let attachMap = {};
          conns.mongo.collection('attachment').find({}).toArray((err, data) => {
            data.forEach(item => attachMap[item.aid] = item);
            resolve(attachMap);
          });
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
            '	      cbs_forum_forum.name as category',
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
            obj.creater = uidMap[item.authorid]._id;
          } else if (warned.indexOf(item.authorid) < 0) {
            obj.creater = null;
            console.log('[WARN] Unknown author id: ' + item.authorid + '. Maybe a deleted spammer?');
            warned.push(item.authorid)
          }
          obj.title = item.subject;
          obj.lastDate = obj.createDate = item.dateline * 1000;
          obj.lastMember = null;
          obj.views = item.views;
          obj.replies = 0;
          obj.tags = [];
          obj.category = categoriesMap[item.category] || item.category;
          obj.tid = item.tid;
          obj.status = { type: 'ok' };

          transformed.push(obj);
        });

        return transformed;
      }

      function attachThreadPosts(dataset, uidMap, aidMap) {
        if (!config.threadAndPost.convertPost) {
          return Promise.resolve(dataset);
        }

        return new Promise((resolve, reject) => {
          console.log('[ThreadAndPost][MySQL] Fetching posts data (it may take some time).')
          let pidMap = {};
          let pidAttachMap = {};
          Object.keys(aidMap).forEach(aid => {
            const attach = aidMap[aid];
            if (pidAttachMap[attach.pid]) {
              pidAttachMap[attach.pid].push(attach._id);
            } else {
              pidAttachMap[attach.pid] = [attach._id];
            }
          })
          let promiseArray = new Array(dataset.length);
          let bindAttachmentPromises = [];
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
                  dataset[i]._id = ObjectId();
                  // dataset[i].participants = [];
                  dataset[i].posts = (dataset[i].tid === 10525) ? [] : data.map(post => {
                    // if (dataset[i].participants.indexOf(uidMap[post.authorid]._id) < 0) {
                    //   dataset[i].participants.push(uidMap[post.authorid]._id);
                    // }
                    return {
                      user: uidMap[post.authorid] ? uidMap[post.authorid]._id : null,
                      createDate: post.dateline * 1000,
                      encoding: 'discuz',
                      content: post.message,
                      allowScript: false,
                      votes: {
                        'up': [],
                        'down': [],
                      },
                      status: { type: 'ok' },
                      pid: post.pid,
                      uid: post.authorid,
                    };
                  });
                  if (dataset[i].posts.length > 0) {
                    dataset[i].lastDate = dataset[i].posts[dataset[i].posts.length - 1].createDate;
                    dataset[i].lastMember = dataset[i].posts[dataset[i].posts.length - 1].user;
                    dataset[i].replies = dataset[i].posts.length;
                    dataset[i].posts.forEach((post, index) => {
                      post.index = index + 1;
                      post.content = contentConverter(post, uidMap);
                      post.encoding = 'html';
                      post.attachments = pidAttachMap[post.pid] || [];

                      // 双向绑定
                      for (let j = 0; j < post.attachments.length; j++) {
                        bindAttachmentPromises.push(conns.mongo.collection('attachment').updateOne(
                          { _id: post.attachments[j] },
                          {
                            $push: {
                              referer: {
                                _discussionId: dataset[i]._id,
                                index: post.index,
                              }
                            }
                          }
                        ));
                      }


                      pidMap[post.pid] = {
                        memberId: post.user,
                        value: index + 1,
                        type: 'index',
                      }

                      const pattern = /^<i=s> 本帖最后由 [^]+? 于 (\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}) 编辑 <\/i><br\/>/i;
                      let updateMatchRes = post.content.match(pattern);
                      if (updateMatchRes) {
                        post.updateDate = new Date(updateMatchRes[1], updateMatchRes[2] - 1, updateMatchRes[3], updateMatchRes[4], updateMatchRes[5]).getTime();
                        post.content = post.content.replace(pattern, '');
                      }

                      // @<Member ID>#<Discussion ID>#<Post Index>
                      const replyPatten0 = /<blockquote>[^]+?forum.php\?mod=redirect\&goto=findpost\&pid=(\d+)\&ptid=\d+[^]+?<\/blockquote><br\/>/i;
                      let replyMatchRes = post.content.match(replyPatten0);
                      if (replyMatchRes && typeof pidMap[replyMatchRes[1]] !== 'undefined') {
                        post.replyTo = pidMap[replyMatchRes[1]];
                        post.content = post.content.replace(replyPatten0, `@${post.replyTo.memberId}#${dataset[i]._id}#${post.replyTo.value} `);
                        return;
                      }

                      const replyPatten1 = /<blockquote>[^]+?redirect.php\?goto=findpost\&pid=(\d+)\&ptid=\d+[^]+?<\/blockquote><br\/>/i;
                      replyMatchRes = post.content.match(replyPatten1);
                      if (replyMatchRes && typeof pidMap[replyMatchRes[1]] !== 'undefined') {
                        post.replyTo = pidMap[replyMatchRes[1]];
                        post.content = post.content.replace(replyPatten1, `@${post.replyTo.memberId}#${dataset[i]._id}#${post.replyTo.value} `);
                        return;
                      }

                      // <blockquote>415987611 发表于 2013-7-31 13:12 但明显nspire配置好点，能省去不少麻烦</blockquote>
                      const replyPatten2 = /<blockquote>[^]+? 发表于 \d+-\d+-\d+ \d+:\d+ ([^>]+?)<\/blockquote><br\/>/i;
                      replyMatchRes = post.content.match(replyPatten2);
                      if (!replyMatchRes) {
                        return;
                      }
                      for (let idx = 0; idx < index; idx++) {
                        let short = replyMatchRes[1].trim().replace(/\.+$/, '').trim();
                        if (dataset[i].posts[idx].content.indexOf(short) >= 0) {
                          post.replyTo = pidMap[dataset[i].posts[idx].pid];
                          post.content = post.content.replace(replyPatten2, `@${post.replyTo.memberId}#${dataset[i]._id}#${post.replyTo.value} `);
                          break;
                        }
                      }
                    })
                  }
                  resolve();
                }
              })
            });
          }

          Promise.all(promiseArray)
            .then(() => Promise.all(bindAttachmentPromises))
            .then(() => {
              resolve(dataset);
            })
            .catch(e => {
              reject(e);
            })
        })
      }

      function attachRates(dataset, uidMap) {
        console.log('[ThreadAndPost][undef] Fetching posts rates.')
        return new Promise((resolve, reject) => {
          conns.mysql.query({
            sql: 'select * from cncalc.cbs_forum_ratelog;'
          }, (err, data) => {
            let rateMap = {};
            for (let record of data) {
              if (!rateMap[record.pid]) {
                rateMap[record.pid] = {}
              }
              if (!rateMap[record.pid][record.uid]) {
                rateMap[record.pid][record.uid] = 0;
              }
              rateMap[record.pid][record.uid] += Number(record.score);
            }
            dataset.forEach(discussion => {
              discussion.posts.forEach(post => {
                if (rateMap[post.pid]) {
                  for (let uid of Object.keys(rateMap[post.pid])) {
                    if (rateMap[post.pid][uid] > 0 && uidMap[uid]) {
                      post.votes.up.push(uidMap[uid]._id);
                    } else if (rateMap[post.pid][uid] < 0 && uidMap[uid]) {
                      post.votes.down.push(uidMap[uid]._id);
                    }
                  }
                }
              });
            });
            resolve(dataset);
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
        let aidMap = await prepareAttachmentData(uidMap);
        let threadData = await fetchThreadData();
        let dataset = transformThreadData(threadData, uidMap);
        dataset = await attachThreadPosts(dataset, uidMap, aidMap);
        dataset = await attachRates(dataset, uidMap, aidMap);
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
