$('#save').click(function (){
  var amountobj = {};
  amountobj["amount"] = $('#amount').val() - 0;
  var pwdobj = {};
  pwdobj["pwd"] = $('#pwd').val();
  var intervalobj = {};
  intervalobj['interval'] = $('#interval').val();
  chrome.storage.local.set(amountobj,function(obj){console.log("save amount");});
  chrome.storage.local.set(pwdobj, function(obj){console.log("save pwd");});
  chrome.storage.local.set(intervalobj, function(obj){console.log("save interval")});
});

//Init config input box
$(function(){
  var defAmount = "";
  var defPwd = "";
  var defInterval = 20000;
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