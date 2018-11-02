const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');
const yt = require('ytdl-core')
const Youtube = require('simple-youtube-api')

const config = require('./config.json');

const youtube = new Youtube(config.youtubeApiKey)

let queues = {}

function writecfg() {
    fs.writeFile("./config.json", JSON.stringify(config), (err) => console.error);
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    writecfg()
});

client.on('guildCreate', (guild) => {
    let id = guild.id
    config.servers[id] = {
        prefix: "."
    }
    writecfg()
})

client.on('message', message => {
    if (message.guild == null) return

    if (config.servers[message.guild.id] === undefined) {
        let id = message.guild.id
        config.servers[id] = {
            prefix: "."
        }
        writecfg()
    }

    let prefix = config.servers[message.guild.id].prefix
    if (!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const guild = message.guild
    const channel = message.channel

    if (command === "prefix") {
        if (!args[0]) return message.reply(`O prefixo atual do servidor e "${prefix}"`)

        config.servers[message.guild.id].prefix = args[0];
        writecfg()
        channel.send(`O prefixo do servidor foi alterado de "${prefix}" para "${args[0]}"`)
    } else if (command == "play") {

        if (!message.member.voiceChannel) return message.reply("Voce nao esta em um Voice channel"); // acaba o comando caso o usuario nao esteja em um voice channel

        if (args.length == 0) return message.reply("Especifique um video ou playlist para ser tocado!");

        message.member.voiceChannel.join()
            .then(connection => {

                let queue = queues[guild.id]

                if (queue === undefined) {
                    queues[guild.id] = new Queue(guild, connection)
                    queue = queues[guild.id]
                }

                let searchQuery = args.join(" ")

                youtube.getPlaylist(args[0])
                    .then(playlist => {
                        playlist.getVideos(50).then(videos => {

                            // Indentificamos uma playlist, lidar com ela

                            let length = queue.songs.length
                            console.log(`\nUma playlist foi adicionada ${playlist.title}`)

                            videos.forEach(video => {
                                queue.addSong(video.url, video.title)
                                console.log(`\nMusica ${video.title} foi adicionada a queue`)
                            });
                            console.log(queue.songs.length)
                        }).catch(err => console.log(err))
                    })
                    .catch(() => {
                        // Nao temos uma playlist, logo ver se e um link para um unico video
                        youtube.getVideo(args[0])
                            .then(video => {
                                // O arg era um link, logo podemos adcionar o video a queue

                                if (queue.songs.length == 0) {
                                    console.log(`\nQueue foi iniciada com a musia "${video.title}" Por link`)
                                    queue.addSong(video.url, video.title)
                                } else {
                                    console.log(`\nA musica "${video.title}" foi adicionada na queue`)
                                    queue.addSong(video.url, video.title)
                                }

                                console.log(`\nUm link normal foi adicionado`)
                            })
                            .catch(() => {
                                // Nao temos um link, logo temos um argumento para pesquisa
                                youtube.searchVideos(searchQuery, 1).then(search => {
                                    let video = search[0]

                                    if (queue.songs.length == 0) {
                                        console.log(`\nQueue foi iniciada com a musia ${video.title} Por pesquisa`)
                                        queue.addSong(video.url, video.title)
                                    } else {
                                        console.log(`\nA musiac ${video.title} foi adicionada na queue`)
                                        queue.addSong(video.url, video.title)
                                    }

                                })
                            })
                            .catch(err => console.log(err))
                    })
            })
            .catch(err => console.log(err))
    } else if (command == "skip") {
        let queue = queues[guild.id]
        queue.dispatcher.end()
    } else if (command == "stop") {
        let queue = queues[guild.id]
        queue.disconnect()
    }
});

class Queue {
    constructor(guild, connection) {
        this.guild = guild
        this.connection = connection

        this.songs = []
        this.dispatcher;

        this.playing = false;
    }

    disconnect() {
        this.playing = false;
        this.connection.disconnect();
        this.songs = undefined
        this.dispatcher = undefined
        queues[this.guild.id] = undefined
    }

    addSong(url, name) {
        let song = {
            url: url,
            name: name
        }

        this.songs.push(song)

        if (!this.playing) this.play()
    }

    play() {

        if (this.songs.length == 0) this.disconnect()

        this.playing = true;

        this.dispatcher = this.connection.playStream(yt(this.songs[0].url, {
                filter: 'audioonly'
            }), {
                bitrate: 'auto'
            })
            .on('end', () => {
                console.log(`Musica ${this.songs[0].name} foi removida da queue`)
                this.songs.shift()

                if (this.songs.length == 0) {
                    this.disconnect()
                    return console.log("Saindo do canal de voz")
                }

                console.log(`Proxima musica "${this.songs[0].name}"`)

                this.play()
            })

        // this.dispatcher.on('end', reason => {
        //     console.log(`Musica ${songs[0].name} foi removida da queue`)
        //     songs.shift()

        //     if (songs.length == 0) return console.log("Saindo do canal de voz")

        //     this.play()
        // })
    }

}

client.on("error", (e) => console.error(e)); // Para o bot nao crashar / crashar sem nenhuma mensagem de erro
client.on("warn", (e) => console.warn(e));
// client.on("debug", (e) => console.info(e));

client.login(config.token);