const Discord = require("discord.js");
const client = new Discord.Client();
const yt = require('ytdl-core')
const Youtube = require('simple-youtube-api')
const fs = require("fs");

const config = require("./config.json");

const youtube = new Youtube(config.youtubeApiKey)

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

client.on("message", async message => {

  if (!message.content.startsWith(config.prefix) || message.author.bot) return

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  let prefix = config.prefix

  switch (command) {
    case "ping":
      message.channel.send("Pong!")
      break;

    case "prefix":
      let newPrefix = args[0]

      Music.updatePrefix = newPrefix

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
      let msg = args
      msg.shift()

      target.send(`${message.author} me mandou te falar isso:
      ${msg.join(" ")}`)
      break;

    case "kick":
      {
        let user = message.mentions.users.first();
        let member = message.guild.member(user);

        if (message.member.permissions.has("KICK_MEMBERS", true)) {
          member.kick().then(() => {

            message.reply(`O membro <@${member.id}> foi kickado!`)

          }).catch(err => {

            message.reply(`Nao foi possivel kickar o usuario: ${err}`)

          })
        } else {
          message.reply(`Voce nao possui as permissoes necessarias para utilizar esse comando`)
        }

      }

      break;

    case "play":

      let channel
      channel = message.member.voiceChannel

      let video = await youtube.getVideo(args[0]).catch(err => console.log(err))

      channel.join().then(connection => {

          let song = {
            url: video.url,
            name: video.title
          }

          let streamOptions = {
            volume: 1,
          }

          const stream = yt(song.url, streamOptions)
          let dispatcher = connection.playStream(stream)

          message.reply(`
        Tocando: ${song.name}
        URL: ${song.url}
        `)
        })
        .catch(err => {
          console.log(err)
        })

        

      break;

    case "help":
      message.channel.send(`Toma os comando ae:
      ${prefix}ping - Ele reponde
      ${prefix}prefix (novo prefixo) - Muda o prefixo`)

  }

  console.log(`O usuario ${message.author.tag}(${message.author}) executou o comando ${command}, com ms = ${client.ping}`)

});

client.login(config.token)