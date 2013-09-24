
goog.require('goog.debug.Console');
goog.require('goog.testing.jsunit');
goog.require('ydn.db');
goog.require('ydn.debug');

goog.require('ydn.db.core.Storage');


var reachedFinalContinuation, schema, objs;
var store_name = 't1';
var db_name = 'test_index_2';

var setUp = function () {

  // ydn.debug.log('ydn.db', 'finest');
  //ydn.db.core.req.SimpleCursor.DEBUG  = true;

  // ydn.db.con.WebSql.DEBUG = true;
  // ydn.db.crud.req.WebSql.DEBUG = true;
  //ydn.db.core.req.WebSql.DEBUG = true;
  //ydn.db.core.req.WebsqlCursor.DEBUG = true;
  //ydn.db.Cursor.DEBUG = true;

  reachedFinalContinuation = false;
};

var tearDown = function() {
  assertTrue('The final continuation was not reached', reachedFinalContinuation);
};



var load_default_cnt = 0;
var load_default = function(cb) {
  var db_name = 'test-default' + (load_default_cnt++);
  var indexSchema = new ydn.db.schema.Index('value', ydn.db.schema.DataType.TEXT, true);
  var typeIndex = new ydn.db.schema.Index('type', ydn.db.schema.DataType.TEXT, false);
  var store_schema = new ydn.db.schema.Store(store_name, 'id', false,
    ydn.db.schema.DataType.INTEGER, [indexSchema, typeIndex]);
  schema = new ydn.db.schema.Database(undefined, [store_schema]);
  var db = new ydn.db.core.Storage(db_name, schema, options);

  objs = [
    {id: -3, value: 'ba', type: 'a', remark: 'test ' + Math.random()},
    {id: 0, value: 'a2', type: 'a', remark: 'test ' + Math.random()},
    {id: 1, value: 'b', type: 'b', remark: 'test ' + Math.random()},
    {id: 3, value: 'b1', type: 'b', remark: 'test ' + Math.random()},
    {id: 10, value: 'c', type: 'c', remark: 'test ' + Math.random()},
    {id: 11, value: 'a3', type: 'c', remark: 'test ' + Math.random()},
    {id: 20, value: 'ca', type: 'c', remark: 'test ' + Math.random()}
  ];

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + ' ready.');
    cb(db);
  });
  return objs;
};


var test_11_list_store = function () {

  var done;
  var result;
  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('length', objs.length, result.length);
      assertArrayEquals(objs, result);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var q = new ydn.db.Iterator(store_name);

  load_default(function (db) {
    db.values(q).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });

};


var test_values_store_reverse = function () {

  var done;
  var result;
  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('length', objs.length, result.length);
      assertArrayEquals(objs.reverse(), result);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var q = new ydn.db.Iterator(store_name, undefined, null, true);
  load_default(function (db) {
    db.values(q).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_values_store_range = function () {

  var done;
  var result;
  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertArrayEquals('result', objs.slice(2, 5), result);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  load_default(function (db) {
    db.values(store_name, ydn.db.KeyRange.bound(1, 10)).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_values_limit = function () {

  var done;
  var result;
  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('length', 3, result.length);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var q = new ydn.db.Iterator(store_name);
  load_default(function (db) {
    db.values(q, 3).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_values_resume = function () {

  var done;
  var result1, result2;
  waitForCondition(
      // Condition
      function() {
        return done;
      },
      // Continuation
      function() {
        assertArrayEquals('first iteration', objs.slice(0, 3), result1);
        assertArrayEquals('second iteration', objs.slice(3, 6), result2);

        reachedFinalContinuation = true;
      },
      100, // interval
      1000); // maxTimeout

  load_default(function (db) {
    var q1 = new ydn.db.Iterator(store_name);
    db.values(q1, 3).addBoth(function(value) {
      result1 = value;
    });
    db.values(q1, 3).addBoth(function(value) {
      result2 = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_values_index_resume = function () {

  var done;
  var result1, result2;
  waitForCondition(
      // Condition
      function() {
        return done;
      },
      // Continuation
      function() {
        assertArrayEquals('first iteration', [objs[4], objs[5]], result1);
        assertArrayEquals('second iteration', [objs[6]], result2);

        reachedFinalContinuation = true;
      },
      100, // interval
      1000); // maxTimeout

  load_default(function(db) {
    var q1 = ydn.db.IndexValueIterator.where(store_name, 'type', '=', 'c');
    db.values(q1, 2).addBoth(function(value) {
      result1 = value;
    });
    db.values(q1, 2).addBoth(function(value) {
      result2 = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_values_index_resume_reverse = function () {

  var done;
  var result1, result2;
  waitForCondition(
      // Condition
      function() {
        return done;
      },
      // Continuation
      function() {
        assertArrayEquals('first iteration', [objs[6], objs[5]], result1);
        assertArrayEquals('second iteration', [objs[4]], result2);

        reachedFinalContinuation = true;
      },
      100, // interval
      1000); // maxTimeout

  load_default(function(db) {
    var q1 = ydn.db.IndexValueIterator.where(store_name, 'type', '=', 'c');
    q1 = q1.reverse();
    db.values(q1, 2).addBoth(function(value) {
      result1 = value;
    });
    db.values(q1, 2).addBoth(function(value) {
      result2 = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_21_list_index = function () {

  var done, result, objs;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('length', objs.length, result.length);
      assertArrayEquals(objs, result);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var q = new ydn.db.IndexValueIterator(store_name, 'value');
  var objs = load_default(function (db) {
    db.values(q).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      //console.log(db.explain(q));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
  goog.array.sort(objs, function(a, b) {
    return goog.array.defaultCompare(a.value, b.value);
  });
};


var test_22_list_index_rev = function () {

  var done, result, objs;


  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('length', objs.length, result.length);
      assertArrayEquals(objs, result);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var q = new ydn.db.IndexValueIterator(store_name, 'value', null, true);
  objs = load_default(function (db) {
    db.values(q).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      //console.log(db.explain(q));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
  goog.array.sort(objs, function(a, b) {
    return - goog.array.defaultCompare(a.value, b.value);
  });
};

var test_23_list_index_range = function () {

  var done, result;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertArrayEquals('result', [objs[1], objs[5], objs[2]], result);

      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var range = ydn.db.KeyRange.bound('a', 'b');
  var q = new ydn.db.IndexValueIterator(store_name, 'value', range);
  load_default(function (db) {
    db.values(q).addBoth(function (value) {
      //console.log(db + ' fetch value: ' + JSON.stringify(value));
      //console.log(db.explain(q));
      result = value;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};



var test_count_by_iterator = function () {


  var done, result;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('result', 3, result);
      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  //var range = ydn.db.KeyRange.bound(1, 10);
  //var iter = new ydn.db.KeyIterator(store_name, range);
  var iter = ydn.db.KeyIterator.where(store_name, '>=', 1, '<=', 10);
  load_default(function (db) {
    db.count(iter).addBoth(function (x) {
      result = x;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });

};

var test_count_by_index_iterator = function () {

  var done, result;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('result', 2, result);
      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var range = ydn.db.KeyRange.only('a');
  var iter = new ydn.db.IndexIterator(store_name, 'type', range);
  load_default(function (db) {
    db.count(iter).addBoth(function (x) {
      result = x;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });
};


var test_list_by_index = function () {

  var done, result;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertArrayEquals('result', objs.slice(0, 2), result);
      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var range = ydn.db.KeyRange.only('a');
  load_default(function (db) {
    db.values(store_name, 'type', range, undefined, undefined).addBoth(function (x) {
      result = x;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });

};

var test_keys_by_index = function () {
  var done, result;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertArrayEquals('result', objs.slice(0, 2).map(function(x) {return x.id}), result);
      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var range = ydn.db.KeyRange.only('a');
  load_default(function (db) {
    db.keys(store_name, 'type', range, 100, 0).addBoth(function (x) {
      result = x;
      done = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });

};


var test_42_remove_by_index_key_range = function() {

  var hasEventFired = false;
  var countValue;

  waitForCondition(
    // Condition
    function() { return hasEventFired; },
    // Continuation
    function() {
      assertEquals('2 b', 2, countValue);
      // Remember, the state of this boolean will be tested in tearDown().
      reachedFinalContinuation = true;
    },
    100, // interval
    1000); // maxTimeout

  var range = ydn.db.KeyRange.bound('b', 'c', false, true);
  load_default(function (db) {
    db.remove(store_name, 'type', range).addBoth(function (value) {
      countValue = value;
      hasEventFired = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    });
  });

};


var test_multiEntry_simple = function () {

  ydn.db.crud.req.WebSql.DEBUG = true;

  var db_name = 'test_multiEntry_simple_1';
  var store_name = 's1';
  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      type: 'TEXT',
      indexes: [{
        name: 'tag',
        type: 'TEXT',
        multiEntry: true
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);


  var objs = [
    {id:'qs0', value: 0, tag: ['a', 'b']},
    {id:'qs1', value: 1, tag: ['a']}
  ];

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + ' ready.');
  });

  // var tags = ['d', 'b', 'c', 'a', 'e'];
  // var exp_counts = [1, 3, 2, 4, 0];
  var tags = ['b'];
  var exp_counts = [1];

  var counts = [];
  var total = tags.length;
  var done = 0;

  waitForCondition(
      // Condition
      function () {
        return done == total;
      },
      // Continuation
      function () {

        for (var i = 0; i < total; i++) {
          assertEquals('for tag: ' + tags[i] + ' count', exp_counts[i], counts[i]);
        }
        reachedFinalContinuation = true;
        ydn.db.deleteDatabase(db.getName(), db.getType());
        db.close();
      },
      100, // interval
      1000); // maxTimeout


  var count_for = function (tag_name, idx) {
    var keyRange = ydn.db.KeyRange.only(tag_name);

    db.values(store_name, 'tag', keyRange).addBoth(function (value) {
      //console.log(tag_name + ' ==> ' + JSON.stringify(value));
      counts[idx] = value.length;
      done++;
    });
  };

  for (var i = 0; i < total; i++) {
    count_for(tags[i], i);
  }

};


var test_multiEntry = function () {

  ydn.db.crud.req.WebSql.DEBUG = true;

  var db_name = 'test_multiEntry_1';
  var store_name = 's1';
  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      type: 'TEXT',
      indexes: [{
        name: 'tag',
        type: 'TEXT',
        multiEntry: true
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);


  var objs = [
    {id:'qs0', value: 0, tag: ['a', 'b']},
    {id:'qs1', value: 1, tag: ['a']},
    {id:'at2', value: 2, tag: ['a', 'b']},
    {id:'bs1', value: 3, tag: ['b']},
    {id:'bs2', value: 4, tag: ['a', 'c', 'd']},
    {id:'bs3', value: 5, tag: ['c']},
    {id:'st3', value: 6, tag: ['x']}
  ];

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + ' ready.');
  });

  // var tags = ['d', 'b', 'c', 'a', 'e'];
  // var exp_counts = [1, 3, 2, 4, 0];
  var tags = ['d'];
  var exp_counts = [1];

  var counts = [];
  var total = tags.length;
  var done = 0;

  waitForCondition(
      // Condition
      function () {
        return done == total;
      },
      // Continuation
      function () {

        for (var i = 0; i < total; i++) {
          assertEquals('for tag: ' + tags[i] + ' count', exp_counts[i], counts[i]);
        }
        reachedFinalContinuation = true;
        ydn.db.deleteDatabase(db.getName(), db.getType());
        db.close();
      },
      100, // interval
      1000); // maxTimeout


  var count_for = function (tag_name, idx) {
    var keyRange = ydn.db.KeyRange.only(tag_name);

    db.values(store_name, 'tag', keyRange).addBoth(function (value) {
      //console.log(tag_name + ' ==> ' + JSON.stringify(value));
      counts[idx] = value.length;
      done++;
    });
  };

  for (var i = 0; i < total; i++) {
    count_for(tags[i], i);
  }

};


var test_multiEntry_text = function () {

  ydn.db.crud.req.WebSql.DEBUG = true;

  var db_name = 'test_multiEntry_text_2';
  var store_name = 's1';
  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      indexes: [{
        name: 'tag',
        multiEntry: true,
        type: 'TEXT'
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);

  var objs = [
    {id:'qs0', value: 0, tag: ['a', 'b']},
    {id:'qs1', value: 1, tag: ['a']},
    {id:'at2', value: 2, tag: ['a', 'b']},
    {id:'bs1', value: 3, tag: ['b']},
    {id:'bs2', value: 4, tag: ['a', 'c', 'd']},
    {id:'bs3', value: 5, tag: ['c']},
    {id:'st3', value: 6, tag: ['x']}
  ];

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + ' ready.');
  });

  var signle_test = true;
  var tags = ['d', 'b', 'c', 'a', 'e'];
  var exp_counts = [1, 3, 2, 4, 0];
  if (signle_test) {
    tags = ['d'];
    exp_counts = [1];

  } else {
  }

  var counts = [];
  var total = tags.length;
  var done = 0;

  waitForCondition(
    // Condition
    function () {
      return done == total;
    },
    // Continuation
    function () {

      for (var i = 0; i < total; i++) {
        assertEquals('for tag: ' + tags[i] + ' count', exp_counts[i], counts[i]);
      }
      reachedFinalContinuation = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    },
    100, // interval
    1000); // maxTimeout


  var count_for = function (tag_name, idx) {
    var keyRange = ydn.db.KeyRange.only(tag_name);

    db.values(store_name, 'tag', keyRange).addBoth(function (value) {
      console.log(tag_name + '[' + tags[idx] + '] ==> ' + JSON.stringify(value));
      counts[idx] = value.length;
      done++;
    });
  };

  for (var i = 0; i < total; i++) {
    count_for(tags[i], i);
  }

};


var test_date_index = function() {
  var db_name = 'test_date_index';
  var store_name = 's1';
  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      type: 'INTEGER',
      indexes: [{
        name: 'updated',
        type: 'DATE'
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);

  var objs = [
    {id: 1, value: Math.random(), updated: new Date( "2013-04-11T13:14:00.000Z")},
    {id: 2, value: Math.random(), updated: new Date( "2013-04-11T13:15:00.000Z")},
    {id: 3, value: Math.random(), updated: new Date( "2013-04-11T13:16:00.000Z")}
  ];

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + ' ready.');
  });

  var done, result, reverse_result;

  waitForCondition(
      // Condition
      function () {
        return done;
      },
      // Continuation
      function () {

        assertArrayEquals('ascending values', objs, result);
        assertArrayEquals('descending values', [objs[2], objs[1], objs[0]], reverse_result);
        reachedFinalContinuation = true;
        ydn.db.deleteDatabase(db.getName(), db.getType());
        db.close();
      },
      100, // interval
      1000); // maxTimeout

  db.values(store_name, 'updated', null, 10, 0).addBoth(function (x) {
    result = x;
  });
  db.values(store_name, 'updated', null, 10, 0, true).addBoth(function (x) {
    reverse_result = x;
    done = true;
  });
};



var test_multiEntry_unique = function () {

  var db_name = 'test_multiEntry_unique';
  var store_name = 's1';
  var schema = {
    stores: [{
      name: store_name,
      keyPath: 'id',
      type: 'INTEGER',
      indexes: [{
        name: 'tag',
        multiEntry: true,
        type: 'TEXT'
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);

  var objs = [
    {id: 1, value: Math.random(), tag: ['a', 'b']},
    {id: 2, value: Math.random(), tag: ['b']},
    {id: 3, value: Math.random(), tag: ['c']}
  ];

  db.clear(store_name);
  db.put(store_name, objs).addCallback(function (value) {
    console.log(db + ' ready.');
  });

  var done, result;

  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {

      assertArrayEquals('unique tag', ['a', 'b', 'c'], result);
      reachedFinalContinuation = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    },
    100, // interval
    1000); // maxTimeout

  var iter = new ydn.db.IndexIterator(store_name, 'tag', null, false, true);
  db.keys(iter).addBoth(function (x) {
    result = x;
    done = true;
  });

};


var compound_index_data = [
  {
    id: 1,
    label1: 'a', label2: 'a'
  }, {
    id: 2,
    label1: 'a', label2: 'b'
  }, {
    id: 3,
    label1: 'b', label2: 'a'
  }, {
    id: 4,
    label1: 'b', label2: 'b'
  }
];

var compound_index_schema = {
  stores: [{
    name: 'st1',
    keyPath: 'id',
    type: 'INTEGER',
    indexes: [
      {
        name: 'lb12',
        keyPath: ['label1', 'label2']
      }
    ]
  }]
};



var comp_cnt = 0;
var load_compound_index_db = function (cb) {
  var compound_index_db_name = 'test-cmp' + (comp_cnt++);
  var db = new ydn.db.crud.Storage(compound_index_db_name, compound_index_schema, options);
  db.clear('st1');
  db.put('st1', compound_index_data);
  cb(db);
};

var compound_index_test = function (db, key_range, len, exp_result) {


  var done, result;

  db.values('st1', 'lb12', key_range, 100, 0).addBoth(function (x) {
    result = x;
    console.log(x);
    done = true;
  });


  waitForCondition(
    // Condition
    function () {
      return done;
    },
    // Continuation
    function () {
      assertEquals('length', len, result.length);
      assertArrayEquals(exp_result, result);
      reachedFinalContinuation = true;
      ydn.db.deleteDatabase(db.getName(), db.getType());
      db.close();
    },
    100, // interval
    1000); // maxTimeout

};


var test_compound_text_open_open = function() {
  var key_range = ydn.db.KeyRange.bound(['a', 'a'], ['b', 'b'], true, true);
  var len = 2;
  var exp_result = compound_index_data.slice(1, 3);
  load_compound_index_db(function (db) {
   compound_index_test(db, key_range, len, exp_result);
  });
};

var test_compound_text_open_close = function () {
  var key_range = ydn.db.KeyRange.bound(['a', 'a'], ['b', 'b'], true);
  var len = 3;
  var exp_result = compound_index_data.slice(1, 4);
  load_compound_index_db(function (db) {
    compound_index_test(db, key_range, len, exp_result);
  });
};

var test_compound_text_close_close = function () {
  var key_range = ydn.db.KeyRange.bound(['a', 'a'], ['b', 'b']);
  var len = 4;
  load_compound_index_db(function (db) {
    var exp_result = compound_index_data.slice();
    // db.values('st1').addBoth(function (x) {console.log(x)});
    compound_index_test(db, key_range, len, exp_result);
  })
};

var test_compound_text_starts = function () {
  var key_range = ydn.db.KeyRange.starts(['a']);
  var len = 2;
  var exp_result = compound_index_data.slice(0, 2);
  load_compound_index_db(function (db) {
    compound_index_test(db, key_range, len, exp_result);
  });
};


var test_order = function() {
  var db_name = 'test_order-2';
  var data = [
    {id: 1, a: 3, b: 'a'},
    {id: 2, a: 2, b: 'b'},
    {id: 3, a: 2, b: 'c'},
    {id: 4, a: 2, b: 'b'},
    {id: 5, a: 1, b: 'b'},
    {id: 6, a: 3, b: 'e'}
  ];
  var schema = {
    stores: [{
      name: 'st',
      keyPath: 'id',
      type: 'INTEGER',
      indexes: [{
        name: 'a',
        type: 'NUMERIC'
      }, {
        name: 'ba',
        keyPath: ['b', 'a']
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);
  db.clear('st');
  db.put('st', data);
  var done, keys1, values1;
  var keys2, values2;

  waitForCondition(
      function() {
        return done;
      },
      function() {
        assertArrayEquals('restrict a = 2 keys', [2, 2, 2], keys1);
        assertArrayEquals('restrict a = 2 values', [data[1], data[2], data[3]], values1);
        assertArrayEquals('restrict b keys', [['b', 2], ['b', 2]], keys2);
        assertArrayEquals('restrict b values', [data[1], data[3]], values2);
        reachedFinalContinuation = true;
        ydn.db.deleteDatabase(db.getName(), db.getType());
        db.close();
      },
      100, // interval
      1000); // maxTimeout

  var iter = new ydn.db.ValueIterator('st');
  var iter1 = iter.order('a', 2);

  db.keys(iter1).addBoth(function(x) {
    keys1 = x;
  });
  db.values(iter1).addBoth(function(x) {
    values1 = x;
  });

  var iter2 = iter1.order('b', 'b');
  db.keys(iter2).addBoth(function(x) {
    keys2 = x;
  });
  db.values(iter2).addBoth(function(x) {
    values2 = x;
    done = true;
  });

};


var test_order_index = function() {
  var db_name = 'test_order_index-2';
  var data = [
    {id: 1, a: 3, b: 'a', c: 1},
    {id: 2, a: 2, b: 'b', c: 1},
    {id: 3, a: 2, b: 'c', c: 1},
    {id: 4, a: 2, b: 'b', c: 2},
    {id: 5, a: 1, b: 'b', c: 2},
    {id: 6, a: 3, b: 'e', c: 2}
  ];
  var schema = {
    stores: [{
      name: 'st',
      keyPath: 'id',
      indexes: [{
        name: 'a'
      }, {
        name: 'ba',
        keyPath: ['b', 'a']
      }, {
        name: 'cba',
        keyPath: ['c', 'b', 'a']
      }]
    }]
  };
  var db = new ydn.db.core.Storage(db_name, schema, options);
  db.clear('st');
  db.put('st', data);
  var done;
  var keys3, values3;
  var keys4, values4;
  var keys5, values5;

  waitForCondition(
      function() {
        return done;
      },
      function() {
        assertArrayEquals('sorted by a keys', exp_keys3, keys3);
        assertArrayEquals('sorted by a values', exp_values3, values3);
        assertArrayEquals('sorted by a, restrict b keys', exp_keys4, keys4);
        assertArrayEquals('sorted by a, restrict b keys', exp_values4, values4);
        assertArrayEquals('sorted by a, restrict b, c keys', [[2, 'b', 1], [2, 'b', 2]], keys5);
        assertArrayEquals('sorted by a, restrict b, c values', [data[4], data[3]], values5);
        reachedFinalContinuation = true;
        ydn.db.deleteDatabase(db.getName(), db.getType());
        db.close();
      },
      100, // interval
      1000); // maxTimeout

  var exp_values3 = goog.array.clone(data);
  exp_values3.sort(function(a, b) {
    return a.a == b.a ? 0 : a.a > b.a ? 1 : -1;
  });
  var exp_keys3 = exp_values3.map(function(x) {
    return x.a;
  });
  var iter3 = new ydn.db.IndexValueIterator('st', 'a');
  db.keys(iter3).addBoth(function(x) {
    keys3 = x;
  });
  db.values(iter3).addBoth(function(x) {
    values3 = x;
  });
  var exp_keys4 = exp_values3.filter(function(x) {
    return x.b == 'b';
  }).map(function(x) {
        return [x.b, x.a];
      });
  var exp_values4 = exp_values3.filter(function(x) {
    return x.b == 'b';
  });
  var iter4 = iter3.order('b', 'b');
  db.keys(iter4).addBoth(function(x) {
    keys4 = x;
  });
  db.values(iter4).addBoth(function(x) {
    values4 = x;
  });

  var iter5 = iter4.order('c', 2);
  db.keys(iter5).addBoth(function(x) {
    keys5 = x;
  });
  db.values(iter5).addBoth(function(x) {
    values5 = x;
    done = true;
  });
};


var test_values = function() {
  var db_name = 'test_values-2';
  var db;
  var df = new goog.async.Deferred();


  var schema_1 = {
    stores: [
      {
        name: 'sii',
        keyPath: 'id',
        type: 'NUMERIC',
        indexes: [
          {name: 'name', type: 'TEXT'},
          {name: 'value', type: 'NUMERIC'},
          {name: 'tags', type: 'TEXT', multiEntry: true}
        ]
      }

    ]
  };
  var objs = [
    {test: 't' + Math.random(), value: 0, id: 0, name: 'a', tags: ['a', 'b']},
    {test: 't' + Math.random(), value: 2, id: 1, name: 'b', tags: ['x']},
    {test: 't' + Math.random(), value: 4, id: 2, name: 'ba', tags: ['z']},
    {test: 't' + Math.random(), value: 6, id: 3, name: 'bc', tags: ['a', 'd', 'c']},
    {test: 't' + Math.random(), value: 8, id: 4, name: 'bd', tags: ['e', 'c']},
    {test: 't' + Math.random(), value: 10, id: 5, name: 'c', tags: ['b']},
    {test: 't' + Math.random(), value: 12, id: 6, name: 'c', tags: ['a']}
  ];

  // persist store data.
  // we don't want to share this database connection and test database connection.
  (function() {
    var _db = new ydn.db.core.Storage(db_name, schema_1, options);
    _db.clear('sii');
    _db.put('sii', objs);

    _db.count('sii').addBoth(function() {
      df.callback();  // this ensure all transactions are completed
    });
    _db.close();
  })();

  var done, result1, result2, result3, result4, result5, result6, result7, result8;

  waitForCondition(
      function() {
        return done;
      },
      function() {
        assertArrayEquals('closed bound', objs.slice(1, 4), result1);
        assertArrayEquals('closed bound reverse', objs.slice(1, 4).reverse(), result2);
        assertArrayEquals('closed bound limit', objs.slice(1, 2), result3);
        assertArrayEquals('closed bound reverse limit', objs.slice(3, 4), result4);
        assertArrayEquals('lowerBound', objs.slice(2), result5);
        assertArrayEquals('open lowerBound', objs.slice(3), result6);
        assertArrayEquals('upperBound', objs.slice(0, 3), result7);
        assertArrayEquals('open upperBound', objs.slice(0, 2), result8);
        reachedFinalContinuation = true;
        ydn.db.deleteDatabase(db.getName(), db.getType());
        db.close();
      },
      100, // interval
      1000); // maxTimeout

  df.addBoth(function() {
    db = new ydn.db.core.Storage(db_name, schema_1, options);
    var key_range = ydn.db.KeyRange.bound(1, 3);
    var q = new ydn.db.ValueIterator('sii', key_range);
    db.values(q).addBoth(function (x) {
      result1 = x;
    });

    key_range = ydn.db.KeyRange.bound(1, 3);
    q = new ydn.db.ValueIterator('sii', key_range, true);
    db.values(q).addBoth(function (x) {
      result2 = x;
    });

    key_range = ydn.db.KeyRange.bound(1, 3);
    q = new ydn.db.ValueIterator('sii', key_range);
    db.values(q, 1).addBoth(function (x) {
      result3 = x;
    });

    key_range = ydn.db.KeyRange.bound(1, 3);
    q = new ydn.db.ValueIterator('sii', key_range, true);
    db.values(q, 1).addBoth(function (x) {
      result4 = x;
    });

    key_range = ydn.db.KeyRange.lowerBound(2);
    q = new ydn.db.ValueIterator('sii', key_range);
    db.values(q).addBoth(function (x) {
      result5 = x;
    });

    key_range = ydn.db.KeyRange.lowerBound(2, true);
    q = new ydn.db.ValueIterator('sii', key_range);
    db.values(q).addBoth(function (x) {
      result6 = x;
    });

    key_range = ydn.db.KeyRange.upperBound(2);
    q = new ydn.db.ValueIterator('sii', key_range);
    db.values(q).addBoth(function (x) {
      result7 = x;
    });

    key_range = ydn.db.KeyRange.upperBound(2, true);
    q = new ydn.db.ValueIterator('sii', key_range);
    db.values(q).addBoth(function (x) {
      result8 = x;
      done = true;
    });
  });

};


var testCase = new goog.testing.ContinuationTestCase();
testCase.autoDiscoverTests();
G_testRunner.initialize(testCase);



