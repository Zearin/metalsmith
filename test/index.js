
const util = require('util')
const assert = require('assert')
const equal = require('assert-dir-equal')
const exec = util.promisify(require('child_process').exec)
const fs = require('fs')
const Metalsmith = require('..')
const Mode = require('stat-mode')
const noop = function(){}
const path = require('path')
const rm = require('fs-extra').remove
const fixture = path.resolve.bind(path, __dirname, 'fixtures')


describe('Metalsmith', function(){
  beforeEach(function(){
    rm('test/tmp')
  })

  it('should expose a constructor', function(){
    assert.equal(typeof Metalsmith, 'function')
  })

  it.skip('should not require the `new` keyword', function(){
    const m = Metalsmith('test/tmp')
    assert(m instanceof Metalsmith)
  })

  it('should error without a working directory', function(){
    assert.throws(
      function(){ Metalsmith() },
      /You must pass a working directory path\./
    )
  })

  it('should use `./src` as a default source directory', function(){
    const m = Metalsmith('test/tmp')
    assert.equal(m._source, 'src')
  })

  it('should use `./build` as a default destination directory', function(){
    const m = Metalsmith('test/tmp')
    assert.equal(m._destination, 'build')
  })

  it('should default clean to `true`', function(){
    const m = Metalsmith('test/tmp')
    assert.equal(m._clean, true)
  })

  describe('#use', function(){
    it('should add a plugin to the plugins stack', function(){
      const m = Metalsmith('test/tmp')
      m.use(noop)
      assert.equal(m.plugins.length, 1)
    })
  })

  describe('#ignore', function(){
    it('should add an ignore file to the internal ignores list', function(){
      const m = Metalsmith('test/tmp')
      m.ignore('dirfile')
      assert(1 == m.ignores.length)
    })

    it('should return the ignore list without arguments', function() {
      const m = Metalsmith('test/tmp')
      m.ignore('dirfile')
      assert(m.ignore()[0] === 'dirfile')
    })
  })

  describe('#directory', function(){
    it('should set a working directory', function(){
      const m = Metalsmith('test/tmp')
      m.directory('dir')
      assert.equal(m._directory, 'dir')
    })

    it('should get the working directory', function(){
      const m = Metalsmith('test/tmp')
      assert(~m.directory().indexOf(path.sep + path.join('test', 'tmp')))
    })

    it('should be able to be absolute', function(){
      const m = Metalsmith('test/tmp')
      m.directory('/dir')
      assert.equal(m.directory(), path.resolve('/dir'))
    })

    it('should error on non-string', function(){
      const m = Metalsmith('test/tmp')
      assert.throws(
        function(){ m.directory(0)}
      )
    })
  })

  describe('#source', function(){
    it('should set a source directory', function(){
      const m = Metalsmith('test/tmp')
      m.source('dir')
      assert.equal(m._source, 'dir')
    })

    it('should get the full path to the source directory', function(){
      const m = Metalsmith('test/tmp')
      assert(~m.source().indexOf(path.resolve(path.join('test', 'tmp', 'src'))))
    })

    it('should be able to be absolute', function(){
      const m = Metalsmith('test/tmp')
      m.source('/dir')
      assert.equal(m.source(), path.resolve('/dir'))
    })

    it('should error on non-string', function(){
      const m = Metalsmith('test/tmp')
      assert.throws(function(){
        m.source(0)
      })
    })
  })

  describe('#destination', function(){
    it('should set a destination directory', function(){
      const m = Metalsmith('test/tmp')
      m.destination('dir')
      assert.equal(m._destination, 'dir')
    })

    it('should get the full path to the destination directory', function(){
      const m = Metalsmith('test/tmp')
      assert(~m.destination().indexOf(path.join('test', 'tmp', 'build')))
    })

    it('should be able to be absolute', function(){
      const m = Metalsmith('test/tmp')
      m.destination('/dir')
      assert.equal(m.destination(), path.resolve('/dir'))
    })

    it('should error on non-string', function(){
      const m = Metalsmith('test/tmp')
      assert.throws(function(){
        m.destination(0)
      })
    })
  })

  describe('#concurrency', function(){
    it('should set a max number for concurrency', function(){
      const m = Metalsmith('test/tmp')
      m.concurrency(15)
      assert.equal(m._concurrency, 15)
    })

    it('should get the max number for concurrency', function(){
      const m = Metalsmith('test/tmp')
      m.concurrency(25)
      assert.equal(m.concurrency(), 25)
    })

    it('should be infinitely concurrent by default', function(){
      const m = Metalsmith('test/tmp')
      assert.equal(m.concurrency(), Infinity)
    })

    it('should error on non-number', function() {
      const m = Metalsmith('test/tmp')
      const badArgs = [NaN, 'hi', process, false, '1', '2', '3']
      badArgs.forEach((bad) => {
        assert.throws(
          () => { return m.concurrency(bad) },
          TypeError
        )
      })
    })

  })

  describe('#clean', function(){
    it('should set the clean option', function(){
      const m = Metalsmith('test/tmp')
      m.clean(false)
      assert.equal(m._clean, false)
    })

    it('should get the value of the clean option', function(){
      const m = Metalsmith('test/tmp')
      assert.equal(m.clean(), true)
    })

    it('should error on non-boolean', function(){
      const m = Metalsmith('test/tmp')
      assert.throws(function(){
        m.clean(0)
      })
    })
  })

  describe('#frontmatter', function(){
    it('should set the frontmatter option', function(){
      const m = Metalsmith('test/tmp')
      m.frontmatter(false)
      assert.equal(m._frontmatter, false)
    })

    it('should get the value of the frontmatter option', function(){
      const m = Metalsmith('test/tmp')
      assert(m.frontmatter(), true)
    })

    it('should error on non-boolean', function(){
      const m = Metalsmith('test/tmp')
      assert.throws(function(){
        m.frontmatter(0)
      })
    })
  })

  describe('#metadata', function(){
    it('should get metadata', function(){
      const m = Metalsmith('test/tmp')
      assert.deepEqual(m.metadata(), {})
    })

    it('should set a clone of metadata', function(){
      const m = Metalsmith('test/tmp')
      const data = { property: true }
      m.metadata(data)
      assert.notEqual(m.metadata(), data)
      assert.deepEqual(m.metadata(), data)
    })

    it('should error on non-object', function(){
      const m = Metalsmith('test/tmp')
      assert.throws(function(){
        m.metadata(0)
      })
    })
  })

  describe('#path', function(){
    it('should return a path relative to the working directory', function(){
      const m = Metalsmith('test/tmp')
      const actualPath = m.path('one', 'two', 'three')
      assert(~actualPath.indexOf(path.resolve('test/tmp/one/two/three')))
    })
  })

  describe('#read', function(){
    it('should read from a source directory', async function(){
      const m = Metalsmith(fixture('read'))
      const stats = fs.statSync(fixture('read/src/index.md'))
      const files = await m.read()
      assert.deepEqual(files, {
        'index.md': {
          title: 'A Title',
          contents: Buffer.from('body'),
          mode: stats.mode.toString(8).slice(-4),
          stats: stats
        }
      })
    })

    it('should traverse a symbolic link to a directory', async function(){
      // symbolic links are not really a thing on Windows
      if (process.platform === 'win32') { this.skip() }
      const m = Metalsmith(fixture('read-symbolic-link'))
      const stats = fs.statSync(fixture('read-symbolic-link/src/dir/index.md'))
      const files = await m.read()
      assert.deepEqual(files, {
        'dir/index.md': {
          title: 'A Title',
          contents: Buffer.from('body'),
          mode: stats.mode.toString(8).slice(-4),
          stats: stats
        }
      })
    })

    it('should read from a provided directory', async function(){
      const m = Metalsmith(fixture('read-dir'))
      const stats = fs.statSync(fixture('read-dir/dir/index.md'))
      const dir = fixture('read-dir/dir')
      const files = await m.read(dir)
      assert.deepEqual(files, {
        'index.md': {
          title: 'A Title',
          contents: Buffer.from('body'),
          mode: stats.mode.toString(8).slice(-4),
          stats: stats
        }
      })
    })

    it('should preserve an existing file mode', async function(){
      const m = Metalsmith(fixture('read-mode'))
      const stats = fs.statSync(fixture('read-mode/src/bin'))
      const files = await m.read()
      assert.deepEqual(files, {
        'bin': {
          contents: Buffer.from('echo test'),
          mode: stats.mode.toString(8).slice(-4),
          stats: stats
        }
      })
    })

    it('should expose the stats property in each file metadata', async function(){
      const m = Metalsmith(fixture('expose-stat'))
      const files = await m.read()
      const file = files['index.md']
      assert(file.stats instanceof fs.Stats)
    })

    it('should not parse frontmatter if frontmatter is false', async function(){
      const m = Metalsmith(fixture('read-frontmatter'))
      m.frontmatter(false)
      const files = await m.read()
      assert.equal(files['index.md'].thing, undefined)
    })

    it('should still read all when concurrency is set', async function(){
      const m = Metalsmith('test/fixtures/concurrency')
      m.concurrency(3)
      const files = await m.read()
      assert.equal(Object.keys(files).length, 10)
    })

    it('should ignore the files specified in ignores', async function(){
      const stats = fs.statSync(path.join(__dirname, 'fixtures/basic/src/index.md'))
      const m = Metalsmith('test/fixtures/basic')
      m.ignore('nested')
      const files = await m.read()
      assert.deepEqual(files, {
        'index.md': {
          date: new Date('2013-12-02'),
          title: 'A Title',
          contents: Buffer.from('body'),
          mode: stats.mode.toString(8).slice(-4),
          stats: stats
        }
      })
    })


    it('should ignore the files specified in function-based ignores', async function(){
      const stats = fs.statSync(path.join(__dirname, 'fixtures/basic/src/index.md'))
      const m = Metalsmith('test/fixtures/basic')
      m.ignore(function(filepath, stats) {
        return stats.isDirectory() && path.basename(filepath) === 'nested'
      })
      const files = await m.read()
      assert.deepEqual(files, {
        'index.md': {
          date: new Date('2013-12-02'),
          title: 'A Title',
          contents: Buffer.from('body'),
          mode: stats.mode.toString(8).slice(-4),
          stats: stats
        }
      })
    })
  })

  describe('#readFile', function() {

    it('should read non-absolute files', async function() {
      const m = Metalsmith(fixture('read'))
      const stats = fs.statSync(fixture('read/src/index.md'))
      const expected = {
        title: 'A Title',
        contents: Buffer.from('body'),
        mode: stats.mode.toString(8).slice(-4),
        stats: stats
      }
      const file = await m.readFile('index.md')
      assert.deepEqual(file, expected)
    })

    it('should error when reading invalid frontmatter', async function() {
      const m = Metalsmith(fixture('read-invalid-frontmatter'))
      m.frontmatter(true)
      try { 
        await m.readFile('index.md')
        throw new Error('This should not execute!')
      }
      catch (err) {
        assert(err instanceof Error)
        assert.throws(
          function () { throw err },
          /invalid frontmatter/i
        )
      }
    })
  })

  describe('#write', function(){
    it('should write to a destination directory', async function(){
      const m = Metalsmith(fixture('write'))
      const files = { 'index.md': { contents: Buffer.from('body') }}
      await m.write(files)
      equal(fixture('write/build'), fixture('write/expected'))
    })

    it('should write to a provided directory', async function(){
      const m = Metalsmith(fixture('write-dir'))
      const files = { 'index.md': { contents: Buffer.from('body') }}
      const dir = fixture('write-dir/out')
      await m.write(files, dir)
      equal(fixture('write-dir/out'), fixture('write-dir/expected'))
    })

    it('should chmod an optional mode from file metadata', async function(){
      // chmod is not really working on windows https://github.com/nodejs/node-v0.x-archive/issues/4812#issue-11211650
      if (process.platform === 'win32') { this.skip() }
      const m = Metalsmith(fixture('write-mode'))
      const files = {
        'bin': {
          contents: Buffer.from('echo test'),
          mode: '0777'
        }
      }

      await m.write(files)
      const stats = fs.statSync(fixture('write-mode/build/bin'))
      const mode = Mode(stats).toOctal()
      assert.equal(mode, '0777')
    })

    it('should still write all when concurrency is set', async function(){
      const m = Metalsmith('test/fixtures/concurrency')
      const files = await m.read()
      await m.write(files)
      equal('test/fixtures/concurrency/build', 'test/fixtures/concurrency/expected')
    })
  })

  describe('#writeFile', function() {
    it('should write non-absolute files', async function() {
      const m = Metalsmith(fixture('write-file'))
      const file = 'index.md'
      const data = { contents: Buffer.from('body') }
      const expected = fixture('write-file/expected')
      
      try       { await m.writeFile(file, data) } 
      catch (e) { throw e }
      
      equal(fixture('write-file/build'), expected)
      assert.equal(
        fs.readFileSync(fixture('write-file/build/index.md'),    'utf8'),
        fs.readFileSync(fixture('write-file/expected/index.md'), 'utf8')
      )
    })
  })

  describe('#run', function(){
    it('should apply a plugin', async function(){
      const m = Metalsmith('test/tmp')
      m.use(function plugin(files, metalsmith, done){
        assert.equal(files.one, 'one')
        assert.equal(m, metalsmith)
        assert.equal(typeof done, 'function')
        files.two = 'two'
        done()
      })
      const files = await m.run({ one: 'one' })
      assert.equal(files.one, 'one')
      assert.equal(files.two, 'two')
    })

    it('should run with a provided plugin', async function(){
      const m = Metalsmith('test/tmp')
      function plugin(files, metalsmith, done){
        assert.equal(files.one, 'one')
        assert.equal(m, metalsmith)
        assert.equal(typeof done, 'function')
        files.two = 'two'
        done()
      }
      const files = await m.run({ one: 'one' }, [plugin])
      assert.equal(files.one, 'one')
      assert.equal(files.two, 'two')
    })

    it('should support synchronous plugins', async function(){
      const m = Metalsmith('test/tmp')
      m.use(function plugin(files, metalsmith){
        assert.equal(files.one, 'one')
        assert.equal(m, metalsmith)
        files.two = 'two'
      })
      const files = await m.run({ one: 'one' })
      assert.equal(files.one, 'one')
      assert.equal(files.two, 'two')
    })
  })

  describe('#process', function(){
    it('should return files object with no plugins', async function(){
      const m = Metalsmith(fixture('basic'))
      const files = await m.process()
      assert.equal(typeof files, 'object')
      assert.equal(typeof files['index.md'], 'object')
      assert.equal(files['index.md'].title, 'A Title')
      assert.equal(typeof files[path.join('nested', 'index.md')], 'object')
    })
    
    it('should apply a plugin', async function(){
      const m = Metalsmith(fixture('basic-plugin'))
      m.use(function(files, metalsmith, done){
        Object.keys(files).forEach(function(file){
          const data = files[file]
          data.contents = Buffer.from(data.title)
        })
        done()
      })
      const files = await m.process()
      assert.equal(typeof files, 'object')
      assert.equal(Object.keys(files).length, 2)
      assert.equal(typeof files['one.md'], 'object')
      assert.equal(files['one.md'].title, 'one')
      assert.equal(files['one.md'].contents.toString('utf8'), 'one')
      assert.equal(typeof files['two.md'], 'object')
      assert.equal(files['two.md'].title, 'two')
      assert.equal(files['two.md'].contents.toString('utf8'), 'two')
    })
  })

  describe('#build', function(){
    it('should do a basic copy with no plugins', async function(){
      const m = Metalsmith(fixture('basic'))
      const files = await m.build()
      assert.equal(typeof files, 'object')
      equal(fixture('basic/build'), fixture('basic/expected'))
    })

    it('should preserve binary files', async function(){
      const m = Metalsmith(fixture('basic-images'))
      const files = await m.build()
      assert.equal(typeof files, 'object')
      equal(fixture('basic-images/build'), fixture('basic-images/expected'))
    })

    it('should apply a plugin', async function(){
      const plugin = function(files, metalsmith, done){
        Object.keys(files).forEach(function(file){
          const data = files[file]
          data.contents = Buffer.from(data.title)
        })
        done()
      }
      const m = Metalsmith(fixture('basic-plugin')).use(plugin)
      await m.build()
      equal(fixture('basic-plugin/build'), fixture('basic-plugin/expected'))
    })

    it('should remove an existing destination directory', async function(){
      const m = Metalsmith(fixture('build'))
      await rm(fixture('build/build'))
      fs.mkdirSync(fixture('build/build'))
      
      try       { await exec('touch test/fixtures/build/build/empty.md') }
      catch (e) { throw e }
      
      try { 
        await m.build() 
        equal(fixture('build/build'), fixture('build/expected'))
      }
      catch (e) { throw e }
    })

    it('should not remove existing destination directory if clean is false', async function(){
      const dir = path.join('test', 'fixtures', 'build-noclean', 'build')
      const cmd = (process.platform === 'win32')
        ? `if not exist ${dir} mkdir ${dir} & type NUL > ${dir}\\empty.md`
        : `mkdir -p ${dir} && touch ${dir}/empty.md`
      const m = Metalsmith(fixture('build-noclean'))
      m.clean(false)

      try       { await exec(cmd) }
      catch (e) { throw e }

      await m.build()
      equal(fixture('build-noclean/build'), fixture('build-noclean/expected'))
    })

  })
})

describe('CLI', function(){
  const bin = `${process.argv0} ${ path.resolve(__dirname, '../bin/metalsmith') }`

  describe('build', function(){
    it('should error without a metalsmith.json', async function(){
      try {
        await exec(bin, { cwd: fixture('cli-no-config') })
      }
      catch (err) {
        assert(err)
        assert(~err.message.indexOf('could not find a metalsmith.json configuration file.'))
      }
    })

    it('should grab config from metalsmith.json', async function(){
      try {
        const cwd = fixture('cli-json')
        const env = {'NODE_NO_WARNINGS':false}
        const {stdout} = await exec(bin, {'cwd':cwd, 'env':env})
        equal(fixture('cli-json/destination'), fixture('cli-json/expected'))
        assert(stdout.includes('successfully built to '), `\nSTDOUT WAS: ${stdout}`)
        assert(stdout.includes(fixture('cli-json/destination')), `\nSTDOUT WAS: ${stdout}`)
      } catch (err) { throw err }
    })

    it('should grab config from a config.json', async function(){
      const {stdout} = await exec(`${bin} -c config.json`, { cwd: fixture('cli-other-config') })
      equal(fixture('cli-other-config/destination'), fixture('cli-other-config/expected'))
      assert(~stdout.indexOf('successfully built to '))
      assert(~stdout.indexOf(fixture('cli-other-config/destination')))
    })

    it('should require a plugin', async function(){
      const {stdout} = await exec(bin, { cwd: fixture('cli-plugin-object') })
      equal(fixture('cli-plugin-object/build'), fixture('cli-plugin-object/expected'))
      assert(~stdout.indexOf('successfully built to '))
      assert(~stdout.indexOf(fixture('cli-plugin-object/build')))
    })

    it('should require plugins as an array', async function(){
      const {stdout} = await exec(bin, { cwd: fixture('cli-plugin-array') })
      equal(fixture('cli-plugin-array/build'), fixture('cli-plugin-array/expected'))
      assert(~stdout.indexOf('successfully built to '))
      assert(~stdout.indexOf(fixture('cli-plugin-array/build')))
    })

    it('should error when failing to require a plugin', async function(){
      try {
        await exec(bin, { cwd: fixture('cli-no-plugin') })
      }
      catch (err) {
        assert(err)
        assert(~err.message.indexOf('failed to require plugin "metalsmith-non-existant".'))
      }
    })

    it('should error when failing to use a plugin', async function(){
      try {
        await exec(bin, { cwd: fixture('cli-broken-plugin') })
      }
      catch (err){
        assert(err)
        assert(~err.message.indexOf('error using plugin "./plugin"...'))
        assert(~err.message.indexOf('Break!'))
        assert(~err.message.indexOf('at module.exports'))
      }
    })

    it('should allow requiring a local plugin', async function(){
      try {
        const {stdout} = await exec(bin, { cwd: fixture('cli-plugin-local') })
        equal(fixture('cli-plugin-local/build'), fixture('cli-plugin-local/expected'))
        assert(~stdout.indexOf('successfully built to '))
        assert(~stdout.indexOf(fixture('cli-plugin-local/build')))
      }
      catch (err) { throw err }
    })
  })

})
