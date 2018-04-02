var tape = require('tape')
var rimraf = require('rimraf')
var create = require('./helpers/create')
var replicate = require('./helpers/replicate')

tape('basic content feed', function (t) {
  var db = create.one(null, {contentFeed: true, valueEncoding: 'json'})

  db.ready(function (err) {
    t.error(err, 'no error')
    db.localContent.append('lots of data')
    db.put('hello', {start: 0, end: 1}, function (err) {
      t.error(err, 'no error')
      db.get('hello', function (err, node) {
        t.error(err, 'no error')
        t.ok(db.localContent === db.contentFeeds[node.feed])
        db.contentFeeds[node.feed].get(node.value.start, function (err, buf) {
          t.error(err, 'no error')
          t.same(buf, Buffer.from('lots of data'))
          t.end()
        })
      })
    })
  })
})

tape('replicating content feeds', function (t) {
  var db = create.one(null, {contentFeed: true})
  db.put('hello', 'world', function () {
    var clone = create.one(db.key, {contentFeed: true})
    db.localContent.append('data', function () {
      replicate(db, clone, function () {
        clone.get('hello', function (err, node) {
          t.error(err, 'no error')
          t.same(node.value, 'world')
          clone.contentFeeds[node.feed].get(0, function (err, buf) {
            t.error(err, 'no error')
            t.same(buf, Buffer.from('data'))
            t.end()
          })
        })
      })
    })
  })
})

tape('reopen content', function (t) {
  rimraf.sync('./db-1')
  var db = create.one(null, {
    contentFeed: true,
    storage: './db-1'
  })
  db.put('hello', 'world', function () {
    db.localContent.append('data', function () {
      db.get('hello', function (err, node) {
        t.error(err, 'no error')
        t.same(node.value, 'world')
        db.put('hello', {start: 0, end: 1}, function (err) {
          t.error(err, 'no error')
          // Reopen, re-using storage
          var dbReopened = create.one(null, {
            storage: './db-1',
            contentFeed: true
          })
          dbReopened.ready(() => {
            t.ok(dbReopened.localContent.writable)
          })
          t.end()
        })
      })
    })
  })
})
