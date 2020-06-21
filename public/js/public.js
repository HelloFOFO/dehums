/**
 * [获取URL中的参数名及参数值的集合]
 * 示例URL:http://htmlJsTest/getrequest.html?uid=admin&rid=1&fid=2&name=小明
 * @param {[string]} urlStr [当该参数不为空的时候，则解析该url中的参数集合]
 * @return {[string]}       [参数集合]
 */
let getRequest = function(urlStr) {
    if (typeof urlStr == "undefined") {
        var url = decodeURI(location.search); //获取url中"?"符后的字符串
    } else {
        var url = "?" + urlStr.split("?")[1];
    }
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}


let renderSelectById = function(key,ajaxSource,cb){
    $.get(ajaxSource,function(data){
        let html = "";
        for(var i in data.data){
            html+='<option value="_Id_">_Name_</option>'
                .replace(/_Id_/,data.data[i][key+'Id'])
                .replace(/_Name_/,data.data[i][key+'Name']);
        }
        if(cb) cb(html);
    });
};

function showResult(title,text){
    $("#div_dialog_result").dialog(
        {
            title:title,
            dialogClass: "no-close",
            modal:true,
            buttons:[
                {text:"确认",click:function(){$(this).dialog("close");}}
            ]
        });
    $("#div_dialog_result").text(text);
    $("#div_dialog_result").dialog("open");
}

function getMenuArea(){
    $.ajax({
        url:"/ajax/arealist",
        async:true,
        method:'GET'
    }).done(function(data){
        let resHtml = ""
        for(var i in data.data){
            // alert(data.data[i].areaId + '-' + data.data[i].areaName)
            resHtml += "<li><a href=\"\\area\\"+data.data[i].areaId+"\">"+data.data[i].areaName+"</a></li>"
        }
        // alert(resHtml)
        $('#ul_area').html(resHtml)
    });
}