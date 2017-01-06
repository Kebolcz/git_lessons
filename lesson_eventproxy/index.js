/*
* author:kebo
* data:20170104
* description:经常出现空值.
*/
var eventproxy = require('eventproxy');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');

var cnodeUrl = 'https://cnodejs.org/';
var cnodeUserUrl = 'https://cnodejs.org/user/';
var result = [];
var users = [];

superagent.get(cnodeUrl)
  .end(function (err, res) {
    if (err) {
      return console.error(err);
    }
    var topicUrls = [];
    var $ = cheerio.load(res.text);
    // console.log("res:",res);
    // console.log("res.body:",res.body);
    $('#topic_list .topic_title').each(function (idx, element) {
      var $element = $(element);
      var href = url.resolve(cnodeUrl, $element.attr('href'));
      topicUrls.push(href);
    });

    var ep = new eventproxy();

    ep.after('topic_html', topicUrls.length, function (topics) {
      topics.map(function (topicPair) {
        var topicUrl = topicPair[0];
        var topicHtml = topicPair[1];
        var $ = cheerio.load(topicHtml);

        users.push($('.user_info').eq(0).find('a').eq(0).text().trim());

        result.push({
          title: $('.topic_full_title').text().trim(),
          href: topicUrl,
          comment1: $('.reply_content').eq(0).text().trim(),
          user:$('.user_info').eq(0).find('a').eq(0).text().trim()
        });
      });

      console.log('final:--------------************************************************-----------------');
      console.log("result:",result);
      deepRequest(result);
    });

    topicUrls.forEach(function (topicUrl) {
      superagent.get(topicUrl)
        .end(function (err, res) {
          console.log('fetch ' + topicUrl + ' successful');
          ep.emit('topic_html', [topicUrl, res.text]);
        });
    });

  });

  function deepRequest(result){
    eq_deep = new eventproxy();

    eq_deep.after('user_html', result.length, function (items) {
      items = items.map(function (item) {
        var $ = cheerio.load(item);

        //item.user_stars = $('.user_profile').find('span').eq(0).text().trim();
        return {user_stars:$('.user_profile').find('span').eq(0).text().trim()};
      });

      console.log("stars------------------>:",items);
      for(var i = 0;i < result.length;i++){
        result[i].stars = items[i].user_stars;
      }

      console.log("final------------------>",result);
    });

    result.forEach(function (item) {
      superagent.get("https://cnodejs.org/user/" + item.user)
        .end(function (err, res) {
          console.log('get ' + item.user + ' successful');
          //console.log('res.html:',res);
          eq_deep.emit('user_html', res.text);
        });
    });

  }