var atna = require("../lib/atna.js");
var utils = require("../lib/utils.js");
var assert = require('assert');
var fs = require('fs');
var libxml = require('libxmljs');

describe('atna.wrapInSyslog', function(){
  it('should wrap a message in syslog format', function(){
    var syslog = atna.wrapInSyslog('test');
    assert(utils.stringStartsWith(syslog, "<85>"));
  });
});

describe('atna.userLoginAudit', function(){
  it('should generate a valid atna user login audit message', function(){
    var audit = atna.userLoginAudit(atna.OUTCOME_SUCCESS, 'IDE-Node', 'localhost', 'test.user', 'Clinician', '123');
    assert(validateAudit(audit));
  });
});

describe('atna.appActivityAudit', function(){
  it('should generate a valid atna application activity audit message', function(){
    var audit = atna.appActivityAudit(true, 'IHE-Node', 'localhost', 'test.user');
    assert(validateAudit(audit));
  });
});


//Helper Functions
function validateAudit(auditXml) {
  var xsd = fs.readFileSync('lib/rfc3881.xsd').toString();
  var xsdDoc = libxml.parseXml(xsd);
  var xml = libxml.parseXml(auditXml);
  if (!xml.validate(xsdDoc)) {
    console.log('XML audit not valid according to XSD:\n' + xml.validationErrors);
    return false;
  } else {
    return true;
  }
}
exports.validateAudit = validateAudit;