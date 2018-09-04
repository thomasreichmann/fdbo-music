const {
  Client,
  RichEmbed
} = require("discord.js");
const client = new Client();
const yt = require('ytdl-core')
const Youtube = require('simple-youtube-api')
const fs = require("fs");
const plays = require("./play")

const config = require("./config.json");

const youtube = new Youtube(config.youtubeApiKey)

let queue = [];
let dispatcher;

/*
TODO:

Skip
Queue (mostrar as musicas ou as 10 primeiras da queue atual, talvez ate com umas paginas)
Transformar a maior parte dos console.log em message.send, para dar feedback ao usuario
*/

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

      if (!message.member.voiceChannel) return message.reply("Voce nao esta em um Voice channel"); // acaba o comando caso o usuario nao esteja em um voice channel

      if (args.length == 0) return message.reply("Especifique um video ou playlist para ser tocado!");

      message.member.voiceChannel.join().then(connection => {

        let searchQuery = args.join(" ")

        youtube.getPlaylist(args[0])
          .then(playlist => {
            playlist.getVideos(50).then(videos => {

              // Indentificamos uma playlist, lidar com ela

              let length = queue.length

              videos.forEach(video => {
                let song = {
                  url: video.url,
                  name: video.title
                }
                queue.push(song)
                console.log(`Musica ${song.name} foi adicionada a queue`)
              });

              if (length == 0) {
                play(connection)
              }

              console.log(`Uma playlist foi adicionada ${playlist.title}`)
            }).catch(err => console.log(err))
          })
          .catch(() => {
            // Nao temos uma playlist, logo ver se e um link para um unico video
            youtube.getVideo(args[0])
              .then(video => {
                // O arg era um link, logo podemos adcionar o video a queue

                let song = {
                  url: video.url,
                  name: video.title
                }

                if (queue.length == 0) {
                  console.log(`Queue foi iniciada com a musia ${song.name}`)
                  queue.push(song)
                  play(connection)
                } else {
                  console.log(`A musiac ${song.name} foi adicionada na queue`)
                  queue.push(song)
                }

                console.log(`Um link normal foi adicionado`)
              })
              .catch(() => {
                // Nao temos um link, logo temos um argumento para pesquisa
                youtube.searchVideos(searchQuery, 1).then(search => {
                  let video = search[0]

                  let song = {
                    url: video.url,
                    name: video.title
                  }

                  if (queue.length == 0) {
                    console.log(`Queue foi iniciada com a musia ${song.name}`)

                    queue.push(song)
                    play(connection)
                  } else {
                    queue.push(song)
                  }

                  console.log(`Adicionado por search`)

                })
              })
              .catch(err => console.log(err))
          })
      })
      break;
      
    case "stop":

      if (client.voiceConnections.size == 0) break;

      queue = []
      message.channel.send("Parando a reproducao e saindo do canal de voz!").then(() => client.voice.connections.first().disconnect())
        .catch(err => console.log(err))

      break;

    case "pause":

      if (client.voiceConnections.size == 0 || !dispatcher) break;

      dispatcher.pause()
      message.channel.send("Pausando a musica!")

      break;

    case "resume":

      if (client.voiceConnections.size == 0 || !dispatcher) break;

      dispatcher.resume()
      message.channel.send("Resumindo a musica!")

      break;

    case "skip":

      if (queue.length == 0) break;

      dispatcher.end()

      break;

    case "embed":

      const embeded = new RichEmbed()
        // Set the title of the field
        .setTitle('A slick little embed')
        // Set the color of the embed
        .setColor(0xFF0000)
        // Set the main content of the embed
        .setDescription('Hello, this is a slick embed!');

      embeded.setAuthor("Test Name");
      embeded.addBlankField()

      embeded.addField("Teste Field", "Teste Value");
      embeded.addBlankField(true)
      embeded.setURL("https://vignette.wikia.nocookie.net/leagueoflegends/images/a/ad/Jinx_Poro.jpg/revision/latest?cb=20150220155035")
      // Send the embed to the same channel as the message
      message.channel.send(embeded);

      break;

    case "help":
      // message.channel.send(`Toma os comando ae:
      // ${prefix}ping - Ele reponde
      // ${prefix}prefix (novo prefixo) - Muda o prefixo`)

      const helpEmbed = new RichEmbed()
        .setAuthor('test')

  }

  console.log(`O usuario ${message.author.tag}(${message.author}) executou o comando ${command}, com ms = ${client.ping}`)

});

function play(connection) {

  if (queue.length == 0) connection.disconnect()

  dispatcher = connection.playStream(yt(queue[0].url, {
    filter: 'audioonly'
  }), {
    bitrate: 'auto'
  })

  dispatcher.on('end', reason => {
    if (queue.length == 0) return console.log("Saindo do canal de voz")
    console.log(`Musica ${queue[0].name} foi removida da queue`)
    queue.shift();

    play(connection)
  })
}

client.login(config.token)