require("cloud/app.js");
// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

AV.Cloud.define("getClassCode",function(request,response) {
var query = new AV.Query('SchoolToAbbreviation');
query.equalTo('school', request.params.school);
query.find({
    success: function(results) {
        
        // 判断是否有重复的函数
        function checkExist(code) {
            var queryCode = new AV.Query("CMClassObject");
            queryCode.equalTo("classCode", code);
            queryCode.find({
                success: function(successResult) {
                if (successResult.length < 1) {
                    response.success(code);
                    return "no";
                }else{
                    return "yes";
                }
            },
                error: function(error) {
                    response.error("检索失败");
                    return "no";
                }
            })
        }
        
        // 获取随机班级码
        function getCode(searchResults) {
            var prefix = searchResults[0].get('abbreviation');
            var access = false;
      
            var code = Math.ceil(Math.random()*100000);
            var temp = String(code);
            var size = temp.length;
            for (var i = 0;i < 5 - size;i++) {
                temp = '0' + temp;
            }
            var subtemp = temp.substr(0, 5);
            var result = prefix + subtemp;
            return result;
        }
        
        while(checkExist(getCode(results)) == "yes");
    },
    error: function() {
      response.error('参数有误');
    }
  });
});