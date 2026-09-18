// Discord.js
const Discord = require('discord.js')
const client = new Discord.Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER', 'USER'],
  intents: Discord.Intents.NON_PRIVILEGED
})
// Load events
const fractal = require('./events/createFractal.js')
// To produce the animated gif
const ffmpeg = require('fluent-ffmpeg')
// Easy settings
const maxRes = 720
// Deploy commands once ready, set the bot's status
client.once('ready', async () => {
  client.user.setActivity('for .help', { type: 'WATCHING' })
  await client.guilds.cache.get('787790019027795999')?.commands.create({
    name: 'mandelbrot',
    description: 'Generate a Mandelbrot or Julia set.',
    options: [{
      name: 'resolution',
      type: 'INTEGER',
      description: `Specifies the square resolution of the generated image. (Maximum = ${maxRes}p)`,
      required: true
    },
    {
      name: 'magnification',
      type: 'INTEGER',
      description: 'Amount of magnification to apply. (zooms to left side of the fractal, no zoom = 1)',
      required: true
    },
    {
      name: 'colormode',
      description: '\nColor modes:\n1 - Grayscale, white fractal\n2 - Grayscale, black fractal\n3 - B&W\n4 - Pseudorandom',
      type: 'INTEGER',
      required: true,
      choices: [
        {
          name: 'White',
          value: 1
        },
        {
          name: 'Black',
          value: 2
        },
        {
          name: 'BlackWhite',
          value: 3
        },
        {
          name: 'Pseudorandom',
          value: 4
        }
      ]
    },
    {
      name: 'julia_set_c_values',
      description: '2 parameters, separated by a semicolon (`;`) - the real and imaginary values of `c` respectively.',
      type: 'STRING',
      required: false
    }]
  })
})
// Slash command interaction listener
client.on('interaction', async interaction => {
  if (!interaction.isCommand()) return
  // Beginning of slash command evaluation
  switch (interaction.commandName) {
    // Mandelbrot command
    case 'mandelbrot':
      switch (true) {
        // Julia sets
        case interaction.options.get('julia_set_c_values') &&
        interaction.options.get('resolution').value <= maxRes:
          fractal.run(interaction, 100, interaction.options.get('resolution').value, interaction.options.get('magnification').value, interaction.options.get('colormode').value, interaction.options.get('julia_set_c_values').value)
          break
        // Mandelbrot sets
        case !interaction.options.get('julia_set_c_values') &&
        interaction.options.get('resolution').value <= maxRes:
          fractal.run(interaction, 100, interaction.options.get('resolution').value, interaction.options.get('magnification').value, interaction.options.get('colormode').value, undefined)
      }
      break
  }
  // if (interaction.commandName === 'mandelbrot' && interaction.options.get('julia_set_c_values')) {
  //   if (interaction.options.get('resolution').value > maxRes) return
  //   await fractal.run(interaction, 100, interaction.options.get('resolution').value, interaction.options.get('magnification').value, interaction.options.get('colormode').value, undefined)
  //   // interaction.reply({ files: ['./fractal.png'] })
  // }
  // if (interaction.commandName === 'mandelbrot' && !interaction.options.get('julia_set_c_values')) {
  //   if (interaction.options.get('resolution').value > maxRes) return
  //   await fractal.run(interaction, 100, interaction.options.get('resolution').value, interaction.options.get('magnification').value, interaction.options.get('colormode').value, undefined)
  //   // interaction.reply({ files: ['./fractal.png'] })
  // }
})
// Listener
client.on('message', async message => {
  // Animation command
  if (message.content.startsWith('.animate')) {
    const parameters = message.content.split(' ').splice(1)
    if (parameters.length > 4 || parameters.slice(0, 3).every(param => typeof parseInt(param) !== 'number')) return
    const width = parseInt(parameters[0])
    if (message.author.id !== '787767500342296646' && width > maxRes) {
      message.channel.send('Resolution too large!')
      return
    }
    const magnification = Number(parameters[1])
    const colorMode = Number(parameters[2])
    if (colorMode > 3 || colorMode < 1) {
      message.channel.send('Improper color selection!')
      return
    }
    if ((parameters[3] && parameters[3].indexOf(';') === -1) || (parameters[3] && parameters[3].indexOf(';') > -1 && parameters[3].split(';').length < 2)) {
      message.channel.send('Improper Julia parameters!')
      return
    }
    // c^2 = a^2 - b^2 + 2ab
    for (let i = 0; i < 50; i++) {
      fractal.run(`../movie/generated${i}.png`, width, magnification, colorMode, parameters[3] || undefined)
    }
    await new Promise((resolve, reject) => {
      ffmpeg()
        .addInput('../movie/generated%01d.png')
        .fps(20)
        .on('end', function () {
          console.log('Video created!')
          resolve()
        })
        .on('error', function (err) {
          console.log('Error when processing animation: ' + err.message)
        })
        .save('./fractal.gif')
    })
    message.channel.send({ files: ['./fractal.gif'] })
  }
})

// Login
client.login('<TOKEN>')

/* --COLORING MODES (REPLACE THE VALUE OF "hexValue")-- */

/*

Math.ceil(2*map(iterationAmount, 0, iterationMaximum, 0x10, 0x7f)).toString(16).repeat(3) + "FF" => Dark to bright (grayscale)
Math.ceil(2*map(iterationAmount, 0, iterationMaximum, 0x7f, 0x10)).toString(16).repeat(3) + "FF" => Bright to dark (grayscale)
map(iterationAmount, 0, iterationMaximum, 0, 0xfffffff) + 0xff => Colorful (pseudorandom)

*/
