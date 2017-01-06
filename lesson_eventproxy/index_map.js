/*
* author:kebo
* data:20170105
* description:使用async.mapLimit()限制并发访问数量.效果不错.
*/
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var async = require('async');


var cnodeUrl = 'https://cnodejs.org/';
//
superagent.get(cnodeUrl)
  .end(function (err, res) {
    if (err) {
      return console.error(err);
    }
    var topicUrls = [];
    var $ = cheerio.load(res.text);
    $('#topic_list .topic_title').each(function (idx, element) {
      var $element = $(element);
      var href = url.resolve(cnodeUrl, $element.attr('href'));
      topicUrls.push(href);
    });

    var fetchParam = function(url, text, callback){
        var $ = cheerio.load(text);
        callback(null,{
          title: $('.topic_full_title').text().trim(),
          href: url,
          comment1: $('.reply_content').eq(0).text().trim(),
          user1:$('.user_info').eq(0).find('a').eq(0).text().trim()
        });

    };

    var fetchStars = function(item, text, callback){
      var $ = cheerio.load(text);
      callback(null,{
        title:item.title,
        href:item.href,
        comment1:item.comment1,
        user1:item.user1,
        stars:$('.user_profile').find('span').eq(0).text().trim()
      });
    };

    async.mapLimit(topicUrls, 2, function (url, callback) {
      superagent.get(url)
        .end(function (err, res) {
          console.log('fetch ' + url + ' successful');
          fetchParam(url,res.text,callback);
        });
    }, function (err, result) {
      console.log('middle:');
      console.log(result);
      async.mapLimit(result, 2, function(item, callback){
        superagent.get('https://cnodejs.org/user/'+item.user1)
          .end(function(err, res){
            console.log("get user ", item.user1, " successful");
            fetchStars(item, res.text, callback);
          });
      },function(err, result){
        console.log('*********************************************************');
        console.log('final:');
        console.log(result);
      });
    });
  });