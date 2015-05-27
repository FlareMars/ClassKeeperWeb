// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var app = express();
var targetUser;	
// App 全局配置
app.set('views', 'cloud/views'); // 设置模板目录
app.set('view engine', 'ejs'); // 设置 template 引擎
app.use(express.bodyParser()); // 读取请求 body 的中间件

// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function(req, res) {
    res.render('hello', {
        message: 'Congrats, you just set up your app!'
    });
});

app.post('/login', function(req, res) {

    console.log('登陆 : ' + req.body.username + ' ' + req.body.password);
    AV.User.logIn(req.body.username, req.body.password).then(function() {
        //登录成功，avosExpressCookieSession会自动将登录用户信息存储到cookie
        //跳转到profile页面。
        console.log('signin successfully: %j', req.AV.user);
        // alert('登陆成功!');
        res.send(req.AV.user);
    }, function(error) {
    	
    });
});


//处理上传文件
var fs = require('fs');
app.post('/upload', function(req, res) {
    var targetFile = req.files.contentFile;

    //登陆用户，获取userId
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
                query.equalTo("userId", targetUser.id);
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

// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen();
