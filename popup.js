var defAmount = "";
var defPwd = "";
chrome.storage.local.get(null, function(configData){
    if(configData['amount']){
      defAmount = configData['amount'];
    }

    if(configData['pwd']){
      defPwd = configData['pwd'];
    }
});

//init amount and pwd
$('#amount').val(defAmount);
$('#pwd').val(defPwd);


$('#save').click(function (){
  var amountobj = {};
  amountobj["amount"] = $('#amount').val() - 0;
  var pwdobj = {};
  pwdobj["pwd"] = $('#pwd').val();
  chrome.storage.local.set(amountobj,function(obj){console.log("save amount");});
  chrome.storage.local.set(pwdobj, function(obj){console.log("save pwd");});
});