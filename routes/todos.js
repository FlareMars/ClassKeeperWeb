var router = require('express').Router();
var AV = require('leanengine');

var AVSdk = require('avoscloud-sdk').AV;
AVSdk.initialize("q77fhkht4neg4ixnybwjnjmodatcoxy4wplq6ocb9lrzy5hs", "vhvdk35bg5p6zsxdsp5boqz2hckljc2djbc7c12834bdj5mv");

// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Todo = AV.Object.extend('Todo');

//声明子类

var SoftwareFeedback = AVSdk.Object.extend("SoftwareFeedback");

// 查询 Todo 列表
router.get('/', function(req, res, next) {
  var query = new AV.Query(Todo);
  query.find({
    success: function(results) {
      res.render('todos', {
        title: 'TODO 列表',
        todos: results
      });
    },
    error: function(err) {
      if (err.code === 101) {
        // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
        // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
        res.render('todos', {
          title: 'TODO 列表',
          todos: []
        });
      } else {
        next(err);
      }
    }
  });
});

// 新增 Todo 项目
router.post('/', function(req, res, next) {
  var content = req.body.content;
  var todo = new Todo();
  todo.set('content', content);
  todo.save(null, {
    success: function(todo) {
      res.redirect('/todos');
    },
    error: function(err) {
      next(err);
    }
  })
});

//登陆
router.post('/login',function(req,res,next) {
  AV.User.logIn(req.body.username, req.body.password).then(function() {
        //登录成功，avosExpressCookieSession会自动将登录用户信息存储到cookie
        // res.redirect('/UploadFile');
        if (req.AV.user) {
            // 如果已经登录，发送当前登录用户信息。
            res.render('UploadFile.ejs');
        } else {
            res.send('登陸失敗!')
        }

    }, function(error) {
        res.send('登陸失敗!' + error.message + ' ' + error.code);
    });
});

//处理上传文件
var fs = require('fs');
router.post('/upload', function(req, res,next) {
  console.log(req.body)
  console.log(req.files)

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

//跳转到测试页
router.get('/test',function(req,res,next) {
  res.render('test');
});

//测试一下save object
router.post('/testJsApi', function(req, res, next) {
    // var gameScore = new GameScore();
    // gameScore.set("score", 1337);
    // gameScore.set("playerName", "Sean Plott");
    // gameScore.set("cheatMode", false);
    // gameScore.save(null, {
    //     success: function(gameScore) {
    //         // Execute any logic that should take place after the object is saved.
    //         console.log('New object created with objectId: ' + gameScore.id);
    //     },
    //     error: function(gameScore, error) {
    //         // Execute any logic that should take place if the save fails.
    //         // error is a AV.Error with an error code and description.
    //         console.log('Failed to create new object, with error code: ' + error.message);
    //     }
    // });

var query = new AV.Query(SoftwareFeedback);
query.get("55617c52e4b0d17d28b03608", {
    success: function(feedBack) {
        // The object was retrieved successfully.
        console.log(feedBack.id);
        res.send(feedBack.get("contact") + ' ' + feedBack.get("content"));
    },
    error: function(object, error) {
        // The object was not retrieved successfully.
        // error is a AV.Error with an error code and description.
        console.log('Failed to query a object, with error code: ' + error.message);

        res.send(error.message);
    }
});


});



module.exports = router;