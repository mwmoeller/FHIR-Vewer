var oidgenerator = require("../lib/oidgenerator.js");
var utils = require("../lib/utils.js");
var assert = require('assert');

describe('oidgenerator.convertUUID', function(){
  it('should return an OID when given a UUID', function(){
    var oid = oidgenerator.convertUUID("f81d4fae-7dec-11d0-a765-00a0c91e6bf6");  
    assert(oid === "2.25.329800735698586629295641978511506172918");
  });
});

describe('oidgenerator.random', function(){
  it('should return a randomly genderated OID', function(){
    var oid = oidgenerator.random();  
    assert(utils.stringStartsWith(oid, "2.25."));
  });
});