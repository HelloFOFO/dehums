
exports.renderHome = function(req,res){
    res.render('index', { title: 'DEHUMSSS' });
}

//登陆,注册,忘记密码页面 TODO:忘记密码暂时没做
exports.renderLogin = function(req,res){
    res.render('login',{action:req.query.action,prePage:req.headers.referer||""});
}

//退出登陆
exports.renderLogout = function(req,res){
    http({
        method:'DELETE',
        uri:conf.serviceEndPoint + '/login'
    },function(error,response,body){
        res.redirect(req.headers.referer);
    })
}