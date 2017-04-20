'use strict';

const { MongoClient } = require('mongodb');

function convertDiscussionContent(config, conns) {

  let convertContent = (input) => {
    checkContent(input);
    let sizeReg = /\[size=(\d+)\]([^]*?)\[\/size\]/g;
    let iReg = /\[i=s\]([^]*?)\[\/i\]/g;
    let urlReg = /\[url\]([^]*?)\[\/url\]/g;
    let newlineReg = /(\r\n|\n)/g;
    input = input.replace(newlineReg, '<br/>\n');
    input = input.replace(iReg, (match, p1) => {
      return `<i class="pstatus">${p1}</i>`
    });
    input = input.replace(urlReg, (match, p1) => {
      return `<a href="${p1}" target="_blank">${p1}</a>`;
    });
    input = input.replace(sizeReg, (match, p1, p2) => {
      return `<font size="${p1}">${p2}</font>\n`;
    });
    return input;
  }

  let checkContent = (input) => {
    let checkReg = /\[([^\/][^\]]*?)\]([^\[]*?)\[([^\/][^\]]*?)\]([^\[]*?)\[\/([^\]]*?)\]/g
    let flag;
    while (flag = checkReg.exec(input)) {
      if (flag[1].search(flag[5]) != -1) {
        console.log("tag is strange.");
        break;
      }
    }
  }

  let getCollection = (docName) => {
    return conns.mongo.collection(docName);
  }
}

module.exports = convertDiscussionContent;
