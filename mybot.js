const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

const fs = require("fs");

function writecfg() {
  fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);
};

function calculateGuilds() {

  let guilds = client.guilds;

  let guildCount = client.guilds.size;
  let userCount = 0;

  guilds.forEach(g => {
    userCount += g.memberCount;
  });

  return [guildCount, userCount];
}

function refreshActivity() {

  let [guildCount, userCount] = calculateGuilds()

  client.user.setActivity(`${guildCount} servers, com ${userCount} users no total!`);
  console.log(`Numero de servers atualizado! ${guildCount} servers, com ${userCount} users`)
}

client.on("ready", () => {
  console.log(`Pronto!`);

  refreshActivity()

  setTimeout(refreshActivity, 36e+6)
});

client.on("message", (message) => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) {
    return
  }

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  let prefix = config.prefix

  switch (command) {
    case "ping":
      message.channel.send("Pong!")
      break;

    case "prefix":
      let newPrefix = args[0]

      if (newPrefix != null) {

        console.log("Meu prefixo foi mudado de: " + prefix + " Para: " + newPrefix)
        message.channel.send("Prefixo mudado de: " + prefix + " Para: " + newPrefix)

        config.prefix = newPrefix
        writecfg()
        //fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);
      }

      break;

    case "mandarmsg":
      let target = message.mentions.members.first()
      let msg = args[1]

      target.send(`${message.author} me mandou te falar isso:
      ${msg}`)
      break;

    case "help":
      message.channel.send(`Toma os comando ae:
      ${prefix}ping - Ele reponde
      ${prefix}prefix (novo prefixo) - Muda o prefixo`)

  }

  console.log(`O usuario ${message.author.tag}(${message.author}) executou o comando ${command}, com ms = ${client.ping}`)

});

client.login(config.token)