// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var AV = require('leanengine');
var app = express();

app.use(AV.Cloud);

var APP_ID = 'q77fhkht4neg4ixnybwjnjmodatcoxy4wplq6ocb9lrzy5hs'; // your app id
var APP_KEY = 'vhvdk35bg5p6zsxdsp5boqz2hckljc2djbc7c12834bdj5mv'; // your app key
var MASTER_KEY = '9m2iywlfjdcxyvmlgwxmlxpzxhlfwi7si99ymg2qx6i60rth'; // your app master key

AV.initialize(APP_ID, APP_KEY, MASTER_KEY);


var avosExpressCookieSession = require('avos-express-cookie-session');
// App 全局配置
app.set('views', 'cloud/views'); // 设置模板目录
app.set('view engine', 'ejs'); // 设置 template 引擎
app.use(express.bodyParser()); // 读取请求 body 的中间件


// 使用 avos-express-cookie-session 记录登录信息到 cookie
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));


// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function(req, res) {
        alert('登陸成功，可以進行文件傳輸操作');
    res.render('hello', {
        message: 'Congrats, you just set up your app!'
    });
});


app.get('/UploadFile', function(req, res) {
    res.render('UploadFile.ejs');
});


app.post('/login', function(req, res) {
    AV.User.logIn(req.body.username, req.body.password).then(function() {
        //登录成功，avosExpressCookieSession会自动将登录用户信息存储到cookie
        // res.redirect('/UploadFile');
        if (req.AV.user) {
            // 如果已经登录，发送当前登录用户信息。
            res.send(req.AV.user);
        } else {
            res.send('登陸失敗!')
        }

    }, function(error) {
        res.send('登陸失敗!' + error.message + ' ' + error.code);
    });
});


//处理上传文件
var fs = require('fs');
app.post('/upload', function(req, res) {
    var targetFile = req.files.contentFile;

    var tempUserId = req.AV.user.id;
    if (targetFile) {
        fs.readFile(targetFile.path, function(err, data) {
            if (err)
                return res.send('读取文件失败');
            var base64Data = data.toString('base64');
            var theFile = new AV.File(targetFile.name, {
                base64: base64Data
            });
            theFile.metaData().size = targetFile.size;
            theFile.save().then(function(theFile) {

                //推送數據到指定用戶
                var query = new AV.Query("_Installation");
                query.equalTo("userId", tempUserId);
                AV.Push.send({
                    appId: "q77fhkht4neg4ixnybwjnjmodatcoxy4wplq6ocb9lrzy5hs",
                    appKey: "vhvdk35bg5p6zsxdsp5boqz2hckljc2djbc7c12834bdj5mv",
                    where: query,
                    data: {
                        action: "cm.action.MESSAGE",
                        msg_type: 12,
                        content_target_id: theFile.id
                    }
                });

                return res.send('上传成功！文件ID為 : ' + theFile.id);
            });
        });
    } else
        res.send('请选择一个文件。');
});
