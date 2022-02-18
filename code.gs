var scriptSet = PropertiesService.getScriptProperties();

//Hubungkan dengan Telegram dan Google Sheet
var token = "*******"; //Isi dengan token telegram bot anda
var sheetID = "*****"; // Isi dengan ID Google Sheet anda
var sheetName = "Sheet1"; // Isi dengan nama Sheet di Google Sheet anda
var webAppURL = "*****"; // isi dengan alamat google script anda setelah di deploy

//Setting Data apa aja yang akan di input
var dataInput = /\/No: (.*)\n\nNama: (.*)\n\nTempat Lahir: (.*)\n\nTanggal Lahir: (.*)\n\nJenis Kelamin: (.*)\n\nAlamat Rumah: (.*)\n\nAlamat Email: (.*)\n\nNo Telp: (.*)\n\nNo Lisensi: (.*)/gmi;
var validasiData = /:\s(0,1)(.+)/ig;

//Pesan jika Format Data yang dikirim Salah
var errorMessage = "😏 Formatnya salah Kak, Coba ulangi lagi";

function tulis(dataInput) {
  var sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
  lRow = sheet.getLastRow();
  sheet.appendRow(dataInput);
  Logger.log(lRow);
}

function breakData(update) {
  var ret = errorMessage;
  var msg = update.message;
  var str= msg.text;
  var match = str.match(validasiData);

//Setting Format Data yang akan diinput
  if (match.length == 9) {
    for(var i=0; i < match.length; i++) {
      match[i] = match[i].replace(':', '').trim();
  }
    ret = "No" + match[0]+"\n\n";
    ret += "Nama" + match[1] +"\n\n";
    ret += "Tempat Lahir" + match[2] +"\n\n";
    ret += "Tanggal Lahir" + match[3] +"\n\n";
    ret += "Jenis Kelamin" + match[4] +"\n\n";
    ret += "Alamat Rumah" + match[5] +"\n\n";
    ret += "Alamat Email" + match[6] +"\n\n";
    ret += "No Telp" + match[6] +"\n\n";
    ret += "No Lisensi" + match[6] +"\n\n";
    ret = "😄 Data (<b>"+match[0]+"</b>) Berhasil Disimpan. Terima Kasih, Kak.";

    var simpan = match;

    var nama = msg.from.first_name;
    if (msg.from.last_name) {
      nama += " " + msg.from.last_name;
    }

    simpan.unshift(nama);

    var waktu = jamConverter(msg.date);
    simpan.unshift(waktu);

    var tanggal = tanggalConverter(msg.date);
    simpan.unshift(tanggal);

    tulis(simpan);
  }
  return ret;
}

function tanggalConverter(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['01', '02', '03', '04', '05', '06','07', '08', '09', '10', '11', '12'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var tanggal = date + '/' +month+ '/' +year;
  return tanggal;
}

function jamConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var jam = hour + ':' +min+ '/' +sec;
  return jam;
}

function escapeHtml(text) {
  var map = {
    '&' : '&amp;',
    '<' : '&lt;',
    '>' : '&gt;',
    '"' : '&quot;',
    "'" : '&#039;',
  };
  return text.replace(/[&<>"']/g, function(m) {return map[m];});
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hey There! Send POST request instead!");
}

function doPost(e) {
  if(e.postData.type == "application/json") {

    var update = JSON.parser(e.postData.contents);
    var bot = new Bot(token, update);
    var bus = new CommandBus();
    bus.on(/\start/i, function () {
      this.replyToSender("<b>Selamat Datang, Perkenalkan Saya Bot Pram 😊</b>");
    });
    bus.on(/^[\/!]test/i, function () {
      this.replyToSender("<b>Aman Terkendali Kak 😊</b>");
    });
    bus.on(/^[\/!]format/i, function () {
      this.replyToSender("<b>/No :</b>\
                          \n<b>Nama :</b>\
                          \n<b>Tempat Lahir :</b>\
                          \n<b>Tanggal Lahir :</b>\
                          \n<b>Jenis Kelamin :</b>\
                          \n<b>Alamat Rumah :</b>\
                          \n<b>Alamat Email :</b>\
                          \n<b>No Telp :</b>\
                          \n<b>No Lisensi :</b>");    
    });
    bus.on(/^[\/!]hallo/i, function () {
      this.replyToSender("<b>Hallo Kak, Have a nice day 🤗</b>");
    });

    bus.on(validasiData, function () {
      var rtext = breakData(update);
      this.replyToSender(text);
    });
    bot.register(bus);

    if (update) {
      bot.process();
    }
  }
}

function setWebhook() {
  var bot = new Bot(token, {});
  var result = bot.request('setWebHook', {
    url: webAppURL
  });
  Logger.log(ScriptApp.getService().getUrl());
  Logger.log(result);
}

function Bot (token, update) {
  this.token = token;
  this.update = update;
  this.handlers = [];
}

Bot.prototype.register = function ( handler) {
  this.handlers.push(handler);
}

Bot.prototype.process = function () {
  for (var i in this.handlers) {
    var event = this.handlers[i];
    var result = event.condition(this);
    if (result) {
      return event.handler(this);
    }
  }
}

Bot.prototype.request = function (method, data) {
  var options = {
    'method' : 'post',
    'contentType' : 'application/json',
    'payload' : JSON.stringify(data)
  };

  var response = UrlFetchApp.fetch('https://api.telegram.org/bot' + this.token + '/' + method, options);

  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  }

  return false;
}

Bot.prototype.replyToSender = function (text) {
  return this.request('sendMessage', {
    'chat_id' : this.update.message.chat.id,
    'parse_mode' : 'HTML',
    'reply_to_message_id' : this.update.message.message_id,
    'text' : text
  });
}

function CommandBus() {
  this.commands = [];
}

CommandBus.prototype.on = function (regexp, callback){
  this.commands.push({'regexp': regexp, 'callback': callback});
}

CommandBus.prototype.condition = function (bot) {
  return bot.update.message.text.charArt(0) === '/';
}

CommandBus.prototype.handle = function (bot) {
  for (var i in this.commands) {
    var cmd = this.commands[i];
    var tokens = cmd.regexp.exec(bot, update.message.text);
    if (tokens != null) {
      return cmd.callback.apply(bot, tokens.splice(1));
    }
  }
  return bot.replyToSender(errorMessage);
}
