exports.stringStartsWith = function(string, prefix) {
  return string.slice(0, prefix.length) == prefix;
};