require('./RedisKeys');
require('./RedisCache');
var notLoginFiles = [
    './not_need_login.js'
]

for (var i = 0; i < notLoginFiles.length; i++) {
    Object.assign(exports, require(notLoginFiles[i]));
}
