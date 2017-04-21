'use strict';

const { MongoClient } = require('mongodb');

function convertDiscussionContent(config, conns) {

  let convertContent = (input) => {
    checkContent(input);
    let codeReg = /\[code\]([^]*?)\[\/code\]/g;
    let fontReg = /\[font=([^\]]+)\]([^]*?)\[\/font\]/g;
    let alignReg = /\[align=([^\]]+)\]([^]*?)\[\/align\]/g;
    let sizeReg = /\[size=([^\]]+)\]([^]*?)\[\/size\]/g;
    let iReg = /\[i=s\]([^]*?)\[\/i\]/g;
    let bReg = /\[b\]([^]*?)\[\/b\]/g;
    let urlReg = /\[url(|=([^\]]*?))\]([^]*?)\[\/url\]/g;
    let newlineReg = /(\r\n|\n)/g;
    let colorReg = /\[color=([^\]]+)\]([^]*?)\[\/color\]/g;
    let quoteReg = /\[quote\]([^]*?)\[\/quote\]/g;

    let attachReg = /\[attach\]([^]*?)\[\/attach\]/g;
    let imgReg = /\[img(|=([^\],]+),([^\]]+))\]([^]*?)\[\/img\]/g;

    input = input.replace(newlineReg, '<br/>\n');
    input = input.replace(codeReg, (match, p1) => {
      return `<code>${p1}</code>`;
    });
    input = input.replace(fontReg, (match, p1, p2) => {
      return `<font style="font-family:${p1}">${p2}</font>`;
    });
    input = input.replace(alignReg, (match, p1, p2) => {
      return `<font style="text-align:${p1}">${p2}</font>`;
    });
    input = input.replace(iReg, (match, p1) => {
      return `<i class="pstatus">${p1}</i>`;
    });
    input = input.replace(bReg, (match, p1) => {
      return `<b>${p1}</b>`;
    });
    input = input.replace(urlReg, (match, p1, p2, p3) => {
      return `<a href="${p2}" target="_blank">${p3}</a>`;
    });
    input = input.replace(sizeReg, (match, p1, p2) => {
      return `<font size="${p1}">${p2}</font>\n`;
    });
    input = input.replace(colorReg, (match, p1, p2) => {
      return `<font color="${p1}">${p2}</font>`;
    });
    input = input.replace(quoteReg, (match, p1) => {
      return `<div class="quote"><blockquote>${p1}</blockquote></div>`;
    })

    input = input.replace(attachReg, (match, p1) => {
      return `<a>${p1}</a>`;
    });
    input = input.replace(imgReg, (match, p1, p2, p3, p4) => {
      return `<img ${p2 === undefined ? '' : 'width="' + p2 + 'px"' + ' height="' + p3 + 'px" '}src="${p4}" />`;
    });

    return input;
  }

  let checkContent = (input) => {
    let checkReg = /\[([^\/][^\]]*?)\]([^\[]*?)\[([^\/][^\]]*?)\]([^\[]*?)\[\/([^\]]*?)\]/g
    let flag;
    while (flag = checkReg.exec(input)) {
      if (flag[1].search(flag[5]) != -1) {
        console.warn("tag is strange.");
        break;
      }
    }
  }

  let getCollection = (docName) => {
    return conns.mongo.collection(docName);
  }

  return new Promise((resolve, reject) => {
    getCollection("discussion").find().toArray(function (err, docs) {
      console.log("Fetching data...")
      docs.forEach(function (discussion) {
        discussion.posts.forEach(function (post) {
          let testReg = /\[([^\]]*?=*.*?)\][^]*?\[\/([^\]]*?)\]/g;
          let opt = testReg.exec(convertContent(post.content));
          if (opt !== null) {
            console.log(`the tag ${opt[1]} needed to resolve.`);
            reject();
          }
        });
      });
      resolve();
    });
  });

}

module.exports = convertDiscussionContent;
