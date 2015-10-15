/**
 * Created by shenkun on 15-2-11.
 */

var confAmount = 0, confPwd = "", confRefInterval = 20000, confProjectPeriod = 90, confYield = 7;


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
                chrome.storage.local.get(projectUrl, function(data){
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

        console.log("---amount: " + confAmount.toString());
        console.log("---pwd: " + confPwd);

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

        var purchaseButton = $('input[value="立即购买"]');

        if(projectType == 0) { //standard project then
            //check project start time
            var timeTxt = $('div[class^="up_time"]').children().text();
            var startTimestamp = Date.parse(timeTxt);

            var projectPeriod = $('dt:contains("项目期限")').next().children()[0].innerHTML - 0;

            if((Date.now() - startTimestamp <= 2000) && (startTimestamp <= Date.now())){  //每次判断是否已到购买时间，因为页面的计时器偏差巨大。第一次检测到达购买时间应立即刷新页面执行脚本，
                                                //需要判断第一次到达时间(超过2秒内，算作第一次到达，最坏情况下多刷新一次)
                //setTimeout(function(){location.reload();}, 1);
                console.log("到达购买时间，刷新页面");
                location.reload();
            }

            if (startTimestamp >= Date.now() || purchaseButton.length == 0) {  //if project doesn't start the return
                console.log("----非购买时段----非适应天数");
                return;
            }
        }else{
            oneDeal.click(); //click yibiquangou
        }

        //get bingo check box, if failed return
        var bingo = $('input[class=bingo]');
        console.log("debug bingon check box: " + bingo.toString());
        if(bingo.length == 0){      //if there's no bingo , we create
            console.log("there's no bingo check box, we create");
            var bingoInput = document.createElement("input");
            bingoInput.setAttribute("type", "checkbox");
            bingoInput.setAttribute("class", "bingo");
            bingoInput.setAttribute("checked", true);
            var tdd = $('dl[class^="clearfix cl"]');   //get agreement table data row
            if(tdd.length == 0){
                return;
            }
            console.log(tdd[5].childNodes[3]);
            tdd[5].childNodes[3].appendChild(bingoInput);  //insert bingo checkbox
            bingo = bingoInput;
            //return;
        }

        function checkEmpty(obj, name){
            if (!(obj.lenght)){
                console.log("There's no " + name);
                //location.reload();   //for debugging, reload when element missing
            }
            return obj.length;
        }

        //agree agreement
        //bingo.setAttribute("checked", true);
        bingo.attr("checked", true);

        //input money, change check status
        var money = $('input[class="txt"]');
        checkEmpty(money, "money box");
        if(projectType == 0) { //standard project
            if(!confAmount) {
                money.val(50000);  //默认设置为5000
            }else{
                //projectRemainNum = Math.max(projectRemainNum-5000, 10000);
                money.val(Math.min(confAmount, projectRemainNum - 5000));   //购买金额选择“设置金额”和“项目剩余金额”中比较小的值
            }
        }
        money.attr("check", "true");

        //click purchase button
        //var purchaseButton = $('input[value="立即购买"]');
        checkEmpty(purchaseButton, "purchaseButton");
        purchaseButton.attr("class", "butInfo");  //make button available for clicking
        purchaseButton.click();

        //转让产品按钮的使能方式不同于标准产品
        if(location.href.startsWith("https://licai.lianjia.com//licai/debentureTransfer/buyBid")){
            purchaseButton.attr("check-cash", "T");
        }


        var inputPwd = function(){
            console.log("Input password and click confirm button!")
            //input password
            var pwdBox = $('input[type=password]');
            if(checkEmpty(pwdBox, "passwordBox")) {
                    pwdBox.val(confPwd);
            }else{return;}

            //click confirm button
            var confirmButton = $('input[value="确认购买"]');
            if(checkEmpty(confirmButton, "confirmButton")) {
                confirmButton.click();
            }else{return;}

            //reload current page
            //location.reload();
        }


        setTimeout(inputPwd, 100);


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
        }

        console.log("-----read configuration completed:" + Date.now().toString());

        if(location.href == "https://licai.lianjia.com/licai"){
            //check if there are some available project can be invested
            console.log("Find available project to be invented in every !" + confRefInterval.toString());
            setTimeout(findProjects, 5000);
            setTimeout(function(){location.reload();}, confRefInterval);
        }else{
            //Purchase current project automatically
            console.log("------purchase project-------");
            setInterval(purchaseProject, 800);
        }
    });


});
