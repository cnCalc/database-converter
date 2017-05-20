'use strict';

const { MongoClient } = require('mongodb');
/*
    .replace(/\[\/(color|size|font)\]/ig,   (match)     => '</span>')
    .replace(/\[\/align\]/ig,               (match)     => '</p>')
    .replace(/\[(b|\/b|i|\/i|u|\/u)\]/ig,   (match, p1) => `</${p1}>`)    
    .replace(/\[list\]/ig,                  (match)     => '<ul>')
    .replace(/\[list\=(.)\]/ig,             (match, p1) => `<ul type="${p1}">`)
    .replace(/\[\*\]/,                      (match)     => '<li>')
    .replace(/\[\/list\]/ig,                (match)     => '</ul>')
    .replace(/\[indent\]/ig,                (match)     => '<blockquote>')
    .replace(/\[\/indent\]/ig,              (match)     => '</blockquote>')
    .replace(/\[\/float\]/ig,               (match)     => '</span>')
    .replace(/\[color=([#\w]+?)\]/ig,       (match, p1) => `<span style="color: ${p1}">`)
    .replace(/\[size=(\d+?)\]/ig,           (match, p1) => `<span style="font-size: ${newSizeArray[Number(p1)]}em">`)
    .replace(/\[size=(\d+(\.\d+)?(px|pt|in|cm|mm|pc|em|ex|%)+?)\]/ig, (match, p1) => `<span style="font-size: ${p1};>`)
    .replace(/\[font=([^\[\<]+?)\]/ig,      (match, p1) => `<span style="font-family: ${p1}">`)
    .replace(/\[align=(left|center|right)\]/ig, (match, p1) => `<p style="text-align: ${p1}; margin: 0;">`)
    .replace(/\[float=(left|right)\]/ig,    (match, p1) => `<span style="float: ${p1}">`)
    .replace(/(\n|\r\n)/ig,                 (match)     => '<br/>')
    .replace(/(\<br\/\>){1,}/ig,            (match)     => '<br/>')
    .replace(/\[(table|\/table|tr|\/tr|\/td)\]/ig, (match, p1) => `<${p1}>`)    
    .replace(/\[td\=\d+\]/ig,               (match, p1) => `<td width=${p1}>`)
    .replace(/\[url\=([^]+?)\]/ig,          (match, p1) => `<a href="${p1}">`)
    .replace(/\[\/url\]/ig,                 (match)     => `</a>`)
    .replace(/\<table\>([^]+?)\<\/table\>/ig, (match, p1) => `<table>${p1.split('<br>').join('')}</table>`)
 */
function convertDiscussionContent(content) {
  let newSizeArray = [undefined, .63, .82, 1, 1.13, 1.5, 2, 3];
  return content
    .replace(/\[\/(size|font)\]/ig,         (match)     => '</span>')
    .replace(/\[(\/backcolor|\/color|)\]/ig,    (match)     => '')
    .replace(/\[\/align\]/ig,               (match)     => '')
    .replace(/\[(b|\/b|i|i\=.|\/i|u|\/u)\]/ig,   (match, p1) => `<${p1}>`)    
    .replace(/\[list\]/ig,                  (match)     => '<ul>')
    .replace(/\[list\=(.)\]/ig,             (match, p1) => `<ul type="${p1}">`)
    .replace(/\[\*\]([^\n]+)\n/ig,           (match, p1) => `<li>${p1}</li>`)
    .replace(/\[\/list\]/ig,                (match)     => '</ul>')
    .replace(/\[indent\]/ig,                (match)     => '<blockquote>')
    .replace(/\[\/indent\]/ig,              (match)     => '</blockquote>')
    .replace(/\[\/float\]/ig,               (match)     => '')
    .replace(/\[(back|)color=([#\w]+?)\]/ig,       (match, p1) => ``)
    .replace(/\[size=(\d+?)\]/ig,           (match, p1) => Number(p1) > 3 ? '<span style="font-weight: bold;">' : (Number(p1) < 3 ? '<span style="font-size: 0.9em;">' :'<span>'))
    .replace(/\[size=(\d+(\.\d+)?(px|pt|in|cm|mm|pc|em|ex|%)+?)\]/ig, (match, p1) => `<span>`)
    .replace(/\[font=([^\[\<]+?)\]/ig,      (match, p1) => `<span>`)
    .replace(/\[align=(left|center|right)\]/ig, (match, p1) => ``)
    .replace(/\[float=(left|right)\]/ig,    (match, p1) => ``)
    .replace(/(\n|\r\n)/ig,                 (match)     => '<br/>')
    .replace(/(\<br\/\>){1,}/ig,            (match)     => '<br/>')
    .replace(/\[url\=([^]+?)\]/ig,          (match, p1) => `<a href="${p1}">`)
    .replace(/\[\/url\]/ig,                 (match)     => `</a>`)
    .replace(/\[table\]([^]+?)\[\/table\]/ig, (match, p1) => `<table>${p1.split('<br/>').join('')}</table>`)
    .replace(/\[(table|\/table|td|tr|\/tr|\/td)\]/ig, (match, p1) => `<${p1}>`)
    .replace(/\[(table|tr|td|)\=([^]+?)\]/ig,               (match, p1, p2) => `<${p1} width=${p2}>`)
    .replace(/\[quote\]([^]+?)\[\/quote\]/ig, (match, p1) => `<blockquote>${p1}</blockquote>`)
}

module.exports = convertDiscussionContent;
