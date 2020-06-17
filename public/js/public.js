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