var js2xml = require('js2xmlparser');
var os = require('os');
var fs = require('fs');
// Event Outcome Indicator
exports.OUTCOME_SUCCESS = 0;
exports.OUTCOME_MINOR_FAILURE = 4;
exports.OUTCOME_SERIOUS_FAILURE = 8;
exports.OUTCOME_MAJOR_FAILURE = 12;

// Network Access Point Type Code
exports.EVENT_ACTION_CREATE = 'C';
exports.EVENT_ACTION_READ = 'R';
exports.EVENT_ACTION_UPDATE = 'U';
exports.EVENT_ACTION_DELETE = 'D';
exports.EVENT_ACTION_EXECUTE = 'E';

// Network Access Point Type Code
exports.NET_AP_TYPE_DNS = 1;
exports.NET_AP_TYPE_IP = 2;
exports.NET_AP_TYPE_TEL = 3;

// Audit Source Type Code
exports.AUDIT_SRC_TYPE_UI = 1;
exports.AUDIT_SRC_TYPE_DATA_AQUISITION = 2;
exports.AUDIT_SRC_TYPE_WEB_SERVER = 3;
exports.AUDIT_SRC_TYPE_APP_SERVER = 4;
exports.AUDIT_SRC_TYPE_DB_SERVER = 5;
exports.AUDIT_SRC_TYPE_SECURITY_SERVER = 6;
exports.AUDIT_SRC_TYPE_NET_COMP = 7;
exports.AUDIT_SRC_TYPE_OS = 8;
exports.AUDIT_SRC_TYPE_EXTERN = 9;

// Participant Object Type Code
exports.OBJ_TYPE_PERSON = 1;
exports.OBJ_TYPE_SYS_OBJ = 2;
exports.OBJ_TYPE_ORG = 3;
exports.OBJ_TYPE_OTHER = 4;

// Participant Object ID Type Code
exports.OBJ_ID_TYPE_MRN = 1;
exports.OBJ_ID_TYPE_PAT_NUM = 2;
exports.OBJ_ID_TYPE_ENCOUNTER_NUM = 3;
exports.OBJ_ID_TYPE_ENROLLEE_NUM = 4;
exports.OBJ_ID_TYPE_SSN = 5;
exports.OBJ_ID_TYPE_ACC_NUM = 6;
exports.OBJ_ID_TYPE_GUARANTOR_NUM = 7;
exports.OBJ_ID_TYPE_REPORT_NAME = 8;
exports.OBJ_ID_TYPE_REPORT_NUM = 9;
exports.OBJ_ID_TYPE_SEARCH_CRIT = 10;
exports.OBJ_ID_TYPE_USER_ID = 11;
exports.OBJ_ID_TYPE_URI = 12;

///
function Code(code, displayName, codeSystemName) {
  this['@'] = {
    code: code,
    displayName: displayName,
    codeSystemName: codeSystemName
  };
}
Code.prototype.constructor = Code;
Code.prototype.toXML = function() {
  return js2xml('Code', this);
};
exports.Code = Code;

///
function EventIdentification(actionCode, datetime, outcome, eventID, typeCode) {
  this['@'] = {
    EventActionCode: actionCode,
    EventDateTime: datetime.toISOString(),
    EventOutcomeIndicator: outcome
  };
  this.EventID = eventID;
  this.EventTypeCode = typeCode;
}
EventIdentification.prototype.constructor = EventIdentification;
EventIdentification.prototype.toXML = function() {
  return js2xml('EventIdentification', this);
};
exports.EventIdentification = EventIdentification;

///
function ActiveParticipant(userId, altUserId, userIsRequestor, netAccessPointId, netAccessPointTypeCode, roleCodes) {
  this['@'] = {
    UserID: userId,
    AlternativeUserID: altUserId,
    UserIsRequestor: userIsRequestor
  };
  if (netAccessPointId) {
    this['@'].NetworkAccessPointID = netAccessPointId;
  }
  if (netAccessPointTypeCode) {
    this['@'].NetworkAccessPointTypeCode = netAccessPointTypeCode;
  }
  this.RoleIDCode = roleCodes;
}
ActiveParticipant.prototype.constructor = ActiveParticipant;
ActiveParticipant.prototype.toXML = function() {
  return js2xml('ActiveParticipant', this);
};
exports.ActiveParticipant = ActiveParticipant;

///
function AuditSourceIdentification(auditEnterpriseSiteId, auditSourceId, auditSourceTypeCode) {
  this['@'] = {
    AuditEnterpriseSiteID: auditEnterpriseSiteId,
    AuditSourceID: auditSourceId
  };
  this.AuditSourceTypeCode = auditSourceTypeCode;
}
AuditSourceIdentification.prototype.constructor = AuditSourceIdentification;
AuditSourceIdentification.prototype.toXML = function() {
  return js2xml('AuditSourceIdentification', this);
};
exports.AuditSourceIdentification = AuditSourceIdentification;

///
function wrapInSyslog(msg) {
  return '<85>1 ' + new Date().toISOString() + ' ' + os.hostname() + ' IHE-Node/atna.js ' + process.pid + ' IHE+RFC-3881 - ' + msg;
}
exports.wrapInSyslog = wrapInSyslog;

///
function AuditMessage(eventIdent, activeParticipants, participantObjs, auditSources) {
  if (eventIdent) {
    this.EventIdentification = eventIdent;
  }
  if (activeParticipants && activeParticipants.length > 0) {
    this.ActiveParticipant = activeParticipants;
  }
  if (participantObjs && participantObjs.lenght > 0) {
    this.ParticipantObjectIdentification = participantObjs;
  }
  if (auditSources && auditSources.length > 0) {
    this.AuditSourceIdentification = auditSources;
  }
}
AuditMessage.prototype.constructor = AuditMessage;
AuditMessage.prototype.toXML = function() {
  return js2xml('AuditMessage', this);
};
exports.AuditMessage = AuditMessage;

///
exports.userLoginAudit = function(outcome, sysname, hostname, username, userRole, userRoleCode) {
  var eventID = new Code(110114, 'UserAuthenticated', 'DCM');
  var typeCode = new Code(110122, 'Login', 'DCM');
  var eIdent = new EventIdentification(exports.EVENT_ACTION_EXECUTE, new Date(), outcome, eventID, typeCode);

  var sysRoleCode = new Code(110150, 'Application', 'DCM');
  var sysParticipant = new ActiveParticipant(sysname, '', true, hostname, exports.NET_AP_TYPE_DNS, [sysRoleCode]);

  var userRoleCodeDef = new Code(userRole, userRole, userRoleCode);
  var userParticipant = new ActiveParticipant(username, '', true, null, null, [userRoleCodeDef]);

  var sourceTypeCode = new Code(exports.AUDIT_SRC_TYPE_UI, '', '');
  var sourceIdent = new AuditSourceIdentification(null, sysname, sourceTypeCode);

  var audit = new AuditMessage(eIdent, [sysParticipant, userParticipant], null, [sourceIdent]);
  return  audit.toXML();
};

///
exports.appActivityAudit = function(isStart, sysname, hostname, username) {
  if (!username) {
    username = 'root';
  }

  var eventID = new Code(110100, 'Application Activity', 'DCM');
  var typeCode;
  if (isStart) {
    typeCode = new Code(110120, 'Application Start', 'DCM');
  } else {
    typeCode = new Code(110121, 'Application Stop', 'DCM');
  }
  var eIdent = new EventIdentification(exports.EVENT_ACTION_EXECUTE, new Date(), exports.OUTCOME_SUCCESS, eventID, typeCode);

  var sysRoleCode = new Code(110150, 'Application', 'DCM');
  var sysParticipant = new ActiveParticipant(sysname, '', true, hostname, exports.NET_AP_TYPE_DNS, [sysRoleCode]);

  var userRoleCodeDef = new Code(110151, 'Application Launcher', 'DCM');
  var userParticipant = new ActiveParticipant(username, '', true, null, null, [userRoleCodeDef]);

  var sourceTypeCode = new Code(exports.AUDIT_SRC_TYPE_WEB_SERVER, '', '');
  var sourceIdent = new AuditSourceIdentification(null, sysname, sourceTypeCode);

  var audit = new AuditMessage(eIdent, [sysParticipant, userParticipant], null, [sourceIdent]);
  return audit.toXML();
};