const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json")

const fs = require("fs")

client.on("ready", () => {
  console.log(`Pronto!`);
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
        fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);
      }

      break;

      case "help":
      message.channel.send(`Toma os comando ae:
      ${prefix}ping - Ele reponde
      ${prefix}prefix (novo prefixo) - Muda o prefixo`)
  }

  console.log(`O ping e igual a: ${client.ping}`)

  // console.log("Mensagem recebida, conteudo: " + message.content + ", do usuario: " + message.member.user.tag)

});

client.login(config.token)