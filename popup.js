$('#save').click(function (){
  var amountobj = {};
  amountobj["amount"] = $('#amount').val() - 0;
  var pwdobj = {};
  pwdobj["pwd"] = $('#pwd').val();
  var intervalobj = {};
  intervalobj['interval'] = $('#interval').val();
  var period = {};
  period['period'] = $('#period').val() - 0;
  var _yield = {};
  _yield['yield'] = $('#yield').val() - 0;
  chrome.storage.local.set(amountobj,function(obj){console.log("save amount");});
  chrome.storage.local.set(pwdobj, function(obj){console.log("save pwd");});
  chrome.storage.local.set(intervalobj, function(obj){console.log("save interval")});
  chrome.storage.local.set(period, function(obj){console.log("save period")});
  chrome.storage.local.set(_yield, function(obj){console.log("save yield")});
});

//Init config input box
$(function(){
  var defAmount = "";
  var defPwd = "";
  var defInterval = 20000;
  var defPeriod = 90;
  var defYield = 7;
  chrome.storage.local.get(null, function(configData){
    //Read trade amount
    if(configData['amount']){
      defAmount = configData['amount'];
      $('#amount').val(defAmount);
    }


    //Read trade password
    if(configData['pwd']){
      defPwd = configData['pwd'];
      $('#pwd').val(defPwd);
    }
    //Read config interval time
    if(configData['interval']){
      defInterval = configData['interval'];
      $('#interval').val(defInterval);
    }

    //Read yield
    if(configData['yield']){
      defYield = configData['yield']-0;
      $('#yield').val(defYield);
    }

    //Read project period
    if(configData['period']){
      defPeriod = configData['period']-0;
      $('#period').val(defPeriod);
    }

  });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("----------receive message from licai page " + request.todo);
      console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
          "from the extension");
      console.log("The message is from window: " + sender.tab.windowId.toString());
      if (request.todo == "checkurl") {
        chrome.tabs.query({url: request.url}, function (tabs) {
          if (tabs.length == 0) {
            if(request.url.startsWith("https://licai.lianjia.com")) {
              chrome.notifications.create("",{title:"New project",type:"basic",iconUrl:"icon.png", message:request.url},null);
              chrome.tabs.create({"url": request.url, "active": false, "windowId":sender.tab.windowId}, function () {
              });
            }else{
              console.log("It's not standard project.");
            }
            sendResponse({"isExist": false});
          } else {
            sendResponse({"isExist": true});
          }
        });
      }
      //sendResponse({farewell: "goodbye"});
    });