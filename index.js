const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json');

const channelLookup = config.channels;

const otherChannel = config.otherChannel;

const colorMapRegex = /`(?:([0-9a-zA-Z]))([^:`\n]{1,2}|[^`\n]{3,}?)`/g;

function getTimestamp() {
  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  return hour + min;
}

function hackmudMessage(channel, user, msg, special) {
  var _timestamp = `${config.bridgeTimestamp}`; //`\`C${getTimestamp()}\``;

  var _channel = special ? `\`N${channel}\`` : `\`V${channel}\``;

  var _user = `\`J${user}\``;
  var _msg = `\`b###\`${msg}`;

  return `${_timestamp} ${_channel} ${_user} ${_msg}`;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

client.on('ready', () => {
  console.log(`discord bot - logged in - as: ${client.user.tag}`);

  var Hackmud = require('@skiilaa/hackmud-chat-api');

  var chat = new Hackmud(config.hackmud);
  console.log('hackmud chat api - logged in - token: ' + chat.token);

  global.chat = chat;

  chat.subscribe(messages => {
    messages.forEach(message => {
      console.log("From: " + message.from_user);
      console.log("To: " + message.to_user);

      var msg = message.msg;
      msg = msg.replace(colorMapRegex, (_, a, b, c) => b);

      msg = message.channel ? `\`\`\`${getTimestamp()} ${message.channel} ${message.from_user} :::${msg}:::\`\`\`` : `\`\`\`${getTimestamp()} TELL ${message.from_user} :::${msg}:::\`\`\``;

      msg = message.is_leave ? msg + ' (leave)' : msg;
      msg = message.is_join ? msg + ' (join)' : msg;

      if (message.channel) {
        if (channelLookup[message.channel]) {
          client.channels.get(channelLookup[message.channel]).send(msg);
        } else {
          client.channels.get(otherChannel).send(msg);
        }
      } else { // If sent in private
        client.channels.get(otherChannel).send();

        console.log("Sent in private");
      }
    });
  });
});

client.on('message', msg => {
  if (msg.author.bot) {
    return;
  }

  var hackmudChannel = getKeyByValue(channelLookup, msg.channel.id);

  if (hackmudChannel) {
    var toSend = config.bridgeTitle + '\n' + hackmudMessage(hackmudChannel, msg.author.username, msg.cleanContent, false);

    console.log(hackmudChannel + ' ' + toSend);

    var err = global.chat.send(config.hackmudUser, hackmudChannel, toSend);

    if (err) {
      console.error(err);

      msg.channel.send(`Error sending hackmud chat message: ${err}`);
    } else {
      msg.delete();
    }
  }
});

client.login(config.discord);