/**
 * Created by shenkun on 15-2-11.
 */

var confAmount = 0, confPwd = "", confRefInterval = 20000, confProjectPeriod = 90, confYield = 7;

var intervalID = 0;  //for testing new method

    var findProjects = function (){

        var projects = $('a[style^=width]');

        for(var i=0; i<projects.length; i++){
            if(projects[0].text == "已售罄"){  //if the first item is sale out then return
                return;
            }
            if(projects[i].text != "已售罄"){

                var period = projects[i].parentNode.previousSibling.previousSibling.previousSibling.children[0].innerHTML - 0;
                if(period > confProjectPeriod){  //project period greater than configuration
                    console.log("Project period greater than configuration.");
                    return;
                }
                var _yield = projects[i].parentNode.previousSibling.previousSibling.previousSibling.previousSibling.children[0].innerHTML - 0;
                if(_yield < confYield){  //project yield less than configuration
                    console.log("Project yield less than configuration.");
                    return;
                }

                var projectTime = Date.now().toString();
                var timeElement = $('em[data-time^=2015]');
                console.log("debug: "+timeElement);
                if(timeElement.length){
                    projectTime = timeElement.attr("data-time").toString();
                }
                //if(timeElement) {
                //    projectTime = timeElement.getAttribute('data-time');
                //}
                var projectUrl = projects[i].getAttribute('href');
                console.log("Find available projects");
                //var getCallback =
                chrome.storage.local.get(null, function(data){
                        console.log("debug get value callback:" + projectUrl + data[projectUrl]);
                        if(data[projectUrl]){  //this project url has been saved

                            // do nothing
                            console.log("----"+projectUrl+" has been saved");
                        }else{
                            var tmp = {};
                            tmp[projectUrl] = projectTime;
                            console.log('----debug------');
                            console.log(tmp);
                            chrome.storage.local.set(tmp,
                                function(){
                                    console.log(projectUrl + ' ' +projectTime);
                                });

                            chrome.runtime.sendMessage(chrome.runtime.id,{todo: "checkurl", url: projectUrl}, function(response) {
                                console.log("Is project url exist: "+response.isExist);
                            });

                            //open(projectUrl);
                        }
                    }
                );

            }
        }

    }


    var purchaseProject = function (){
        //location.reload();

        //$('p:contains("账户余额")').children()[0].innerHTML - 0
        var remain = $('p:contains("账户余额")');
        //获取当前项目的剩余可投资金额
        var projectRemainNum = confAmount;
        var projectRemain = $('dt:contains("剩余可投金额")');
        if(projectRemain.length) {
            projectRemainNum = projectRemain.next().children()[0].innerHTML.replace(/\,/g, "") - 0;
        }

        if(!confAmount || confAmount =="" || !confPwd || confPwd == "" || remain.length == 0){
            $('body').css("background-color","yellow");
            console.log("金额和密码没有设置,或者没有登录账号");
            return;
        }

        var remainSum = remain.children()[0].innerHTML - 0; //获取账户余额
        if(remainSum < 1000.0){   //投资最小金额1000元
            console.log("账户余额小于1000元！");
            return;
        }

        var accountRemain = Math.floor(($('p.surplus span.c_red').text()-0)/1000) * 1000;//账户剩余可投金额1000整数倍
        var postAmount  = Math.min(confAmount, accountRemain, projectRemainNum);


        console.log("---amount: " + confAmount.toString());
        console.log("---pwd: " + confPwd);
        console.log("---postAmount: " + postAmount);

        var transfer = false;
        var projectType = 0;
        var oneDeal = $('strong[class^="c_blue"]');
        if(oneDeal.length !=0) {
            if (oneDeal.text() == "一笔全购") {  //transer project
                console.log("一笔全购类型");
                projectType = 1;
            }else{
                console.log("标准类型");
                projectType = 0;
            }
        }

        if(location.href.startsWith("https://licai.lianjia.com/licai_")){
            projectType = 0;
        }else{
            projectType = 1;
        }

        //check project start time
        var timeTxt = $('div[class^="up_time"]').children().text();
        var startTimestamp = Date.parse(timeTxt) + 30000;  //已知开始购买的服务器时间滞后于真实时间约 30s

        var currentTime = Date.now();

        //在临近开始购买时间5-10秒内，估计10s内倒计时牌的误差可以控制在1-2s
        if(((currentTime - startTimestamp) <= 12000) && ((currentTime - startTimestamp) >= 5000)){
            console.log("购买时间到达前10s刷新页面，保证页面倒计时精度，后面的购买时间依赖于页面倒计时");
            location.reload();
        }


        var purchaseButton = $('input[value="立即购买"]');

        //获取倒计时牌的时间
        var timePad = $('div.waitMin').text();
        //无法精确得知何时可以开始购买，但可以肯定是在倒计时牌归零前某一时刻，故而在归零前4秒都可以购买。
        // 通过手动测试得知，连续三次购买后会算作“频繁购买”，选择归零前最多四次购买机会（定时器间隔1s），不成功也不再尝试购买
        if(timePad == "00:00:04" || timePad == "00:00:03" || timePad == "00:00:02" || timePad == "00:00:01"){
       // if((currentTime - startTimestamp <= 60000) && (startTimestamp <= currentTime) && (currentTime - startTimestamp >= 40000)) {  //每次判断是否已到购买时间，因为页面的计时器偏差巨大。第一次检测到达购买时间应立即刷新页面执行脚本，
            //需要判断第一次到达时间(超过2秒内，算作第一次到达，最坏情况下多刷新一次)

            if (projectType == 0) { //standard project then


                //setTimeout(function(){location.reload();}, 1);
                console.log("开始购买10秒内，尝试post购买指令，之后reload");

                //********************//
                //Inject js code for using global variable homelink_config and HomeLink
                var actualCode = ['if(location.href.startsWith("https://licai.lianjia.com/licai_")) {',
                    'var b = {};',
                    'b.payKey ="' + confPwd + '";',
                    'b.investment = ' + postAmount + ';',

                    'var dotPosition = location.href.indexOf(".html");',
                    'b.bidId = location.href.slice(32, dotPosition) - 0;',

                    'b.cashCoupon = 0;',
                    'console.log("----post data------");',
                    'console.log(b);',
                    'console.log(Date.now());',

                    '$.post(homelink_config.basePath + "manageMoney/tenderFreeze", HomeLink.tools.safeRnd.init(b), function (d) {',
                    'console.log(d);',
                    'if (d.result) {',
                    'location.href="www.baidu.com"',
                    'console.log("购买产品成功，停止计时器");',
                    'console.log(d.data);',
                    'for(var k in d.data){',
                    'console.log(k + " : " + d.data[k]);',
                    '}',
                    '}',
                    'return;',
                    '});',
                    '}'
                ].join("\n");
                var script = document.createElement('script');
                script.textContent = actualCode;
                (document.head || document.documentElement).appendChild(script);
                script.parentNode.removeChild(script);

                //********************//
                //confPwd = "test";
                //postAmount = 50000;
                //if(location.href.startsWith("https://licai.lianjia.com/licai_")) {
                //    var b = {};
                //    b.payKey = confPwd;
                //    b.investment = postAmount;//confAmount;
                //
                //    var dotPosition = location.href.indexOf(".html")
                //    b.bidId = location.href.slice(32, dotPosition) - 0;
                //
                //    b.cashCoupon = 0;
                //    console.log("----post data------");
                //    console.log(b);
                //    console.log(Date.now());
                //
                //    $.post(homelink_config.basePath + "manageMoney/tenderFreeze", HomeLink.tools.safeRnd.init(b), function (d) {
                //        console.log(d);
                //        if (d.result) {
                //            console.log("购买产品成功，停止计时器");
                //            console.log(d.data);
                //            for(var k in d.data){
                //                console.log(k + " : " + d.data[k]);
                //            }
                //            if(intervalID){
                //                clearInterval(intervalID);
                //                intervalID = 0;
                //            }
                //
                //
                //        }
                //        return;
                //    });
                //}
                return;


            } else {
                //oneDeal.click(); //全部转让必须一笔全购类型，点击 一笔全购。后期可能考虑放弃这种类型的产品购买
                //处理转让标的，post参数比标准标的 多一个转让id，标的ID需要从页面中获取，因为链接中只存在转让ID
                //转让没有倒计时牌，打开页面即可开始抢购

            }

        }

        //return; //just use post method
        //get bingo check box, if failed then create one
        if(projectType == 1) {
            var bingo = $('input[class=bingo]');
            console.log("debug bingon check box: " + bingo.toString());
            if (bingo.length == 0) {      //if there's no bingo , we create
                console.log("there's no bingo check box, we create");
                var bingoInput = document.createElement("input");
                bingoInput.setAttribute("type", "checkbox");
                bingoInput.setAttribute("class", "bingo");
                bingoInput.setAttribute("checked", true);
                var tdd = $('dl[class^="clearfix cl"]');   //get agreement table data row
                if (tdd.length == 0) {
                    return;
                }
                console.log(tdd[5].childNodes[3]);
                tdd[5].childNodes[3].appendChild(bingoInput);  //insert bingo checkbox
                bingo = bingoInput;
            }

            function checkEmpty(obj, name) {
                if (!(obj.lenght)) {
                    console.log("There's no " + name);
                }
                return obj.length;
            }

            //agree agreement
            bingo.attr("checked", true);

            //input money, change check status
            var money = $('input[class="txt"]');
            checkEmpty(money, "money box");
            if (projectType == 0) { //standard project
                if (!confAmount) {
                    money.val(50000);  //默认设置为5000
                } else {
                    money.val(Math.min(confAmount, projectRemainNum));   //购买金额选择“设置金额”和“项目剩余金额”中比较小的值
                }
            }
            money.attr("check", "true");

            //click purchase button
            checkEmpty(purchaseButton, "purchaseButton");
            purchaseButton.attr("class", "butInfo");  //make button available for clicking
            purchaseButton.click();

            //转让产品按钮的使能方式不同于标准产品
            if (location.href.startsWith("https://licai.lianjia.com//licai/debentureTransfer/buyBid")) {
                purchaseButton.attr("check-cash", "T");
            }


            var inputPwd = function () {
                console.log("Input password and click confirm button!")
                //input password
                var pwdBox = $('input[type=password]');
                if (checkEmpty(pwdBox, "passwordBox")) {
                    pwdBox.val(confPwd);
                } else {
                    return;
                }

                //click confirm button
                var confirmButton = $('input[value="确认购买"]');
                if (checkEmpty(confirmButton, "confirmButton")) {
                    confirmButton.click();
                } else {
                    return;
                }

                location.href = "http://www.baidu.com";
            }

            //Delay 100ms for waiting popup box show
            setTimeout(inputPwd, 100);
        }


    }

$(function(){
    console.log("-----read configuration:" + Date.now().toString());
    chrome.storage.local.get(null, function(data){  //get default amount and configured password
        confAmount = data['amount'];
        confPwd = data['pwd'];
        confProjectPeriod = data['period'] - 0;
        confYield = data['yield'] - 0;
        //Refresh "https://licai.lianjia.com/licai" automatically in every x seconds, default value is 20s
        confRefInterval = "undefined" == typeof(data['interval']) ? 20000 : data['interval'];
        //confRefInterval = data['interval'] - 0;

        if(!confAmount || confAmount =="" || !confPwd || confPwd == ""){
            var warning = '<div display="width:400px; height:200px; text-align:center; background-color:yellow; color:red;" align="center">请先设置' +
                '购买金额和密码（金额不能小于1000密码不能为空！）</div>';
            $('body').prepend(warning);
            return;
        }

        if(location.href == "https://licai.lianjia.com/licai"){
            //check if there are some available project can be invested
            console.log("Find available project to be invented in every " + confRefInterval.toString());
            setTimeout(findProjects, 5000);
            setTimeout(function(){location.reload();}, confRefInterval);
        }else{
            //Purchase current project automatically
            console.log("------purchase project-------");
            intervalID = setInterval(purchaseProject, 1000);
        }
    });


});
