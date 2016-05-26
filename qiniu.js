var qiniu = require("qiniu");

//需要填写你的 Access Key 和 Secret Key
qiniu.conf.ACCESS_KEY = 'PRHdf9jKH7WtCMspbDTV9rdW_me7wmPr9xqITV5G';
qiniu.conf.SECRET_KEY = '27qUe_bHJT3G6C-3NpUCW72xf3tO_uG_qwwdWFVR';

//要上传的空间
bucket = 'qidian';

var sendFile = function (fileName, filePath) {
	//上传到七牛后保存的文件名
	var key = fileName;

	//构建上传策略函数
	function uptoken(bucket, key) {
	  var putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
	  return putPolicy.token();
	}

	//生成上传 Token
	var token = uptoken(bucket, key);

	//要上传文件的本地路径
	var path = filePath;

	//构造上传函数
	function uploadFile(uptoken, key, localFile) {
	  var extra = new qiniu.io.PutExtra();
		qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
		  if(!err) {
			// 上传成功， 处理返回值
			console.log(ret.hash, ret.key, ret.persistentId);
		  } else {
			// 上传失败， 处理返回代码
			console.log(err);
		  }
	  });
	}

	//调用uploadFile上传
	uploadFile(token, key, path);
}

// Node.js读取文件
var fs = require('fs');
var path = require('path');

const ROOT = __dirname + '/www/';
var root = fs.readdirSync(ROOT);
var cwd = process.cwd();
var files = [];
var uploadedFiles = Object.create(null);
var sendIndex = -1;
var done = 0;
var error = 0;

var log = 'log.json';
var checkedFiles = {};
try {
	var checkedFileContent = fs.readFileSync(log);
	if (checkedFileContent) {
		checkedFiles = JSON.parse(checkedFileContent);
	}
} catch (e) {
}

var EXCLUDE = /\.(php|html|java|log|psd|doc|txt|DS_Store)/gi;
var listDir = function (parent, dir) {
	for (var i = 0, len = dir.length; i<len; i++) {
		var p = path.resolve(parent, dir[i]);
		//console.log('resolve file ', p);
		//console.log(path.relative(ROOT, p));
		EXCLUDE.lastIndex = 0;
		if (EXCLUDE.test(path.extname(p))) {
			continue;
		}
		var f = fs.lstatSync(p);
		if (f.isFile()) {
			if (typeof checkedFiles[path.basename(p)] == 'undefined') {
				files.push(p);
				sendFile(p.substring(p.indexOf('/www/') + 5), p);
				console.log('found %s', '/' + path.relative(ROOT, p));
			}
		} else {
			listDir(p, fs.readdirSync(p));
		}
	}
};
listDir(ROOT, root);
