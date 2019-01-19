const fs = require('fs-plus')
const sqlite = require('sqlite3')
const knexLib = require('knex')

const dbFile = './example_db.sqlite'

// remove any existing database
fs.removeSync(dbFile)

const knex = knexLib({
  client: 'sqlite3',
  connection: {
    filename: dbFile
  }
})

createSchema().then(afterSchemaCreation)

function afterSchemaCreation () {
  const createUserPromise = createUser('johnny', 'bravo', 'the fastest man alive!')
  const createPlaylistPromise = createPlaylist('awesome playlist', 'only the best songs')

  Promise.all([createUserPromise, createPlaylistPromise]).then(function (results) {
    const userInsertValues = results[0]
    const newUserId = userInsertValues[0]
    console.log('johnny bravo id:', newUserId)

    const playstlistInsertValues = results[1]
    const newPlaylistId = playstlistInsertValues[0]
    console.log('awesome playlist id:', newPlaylistId)

    createUserPlaylistLink(newUserId, newPlaylistId).then(function () {
      console.log('User ' + newUserId + ' linked to Playlist ' + newPlaylistId)
    })
  })
}

// -----------------------------------------------------------------------------
// "Data layer" functions
// NOTE: each of these functions returns a promise, allowing for easy chaining
// -----------------------------------------------------------------------------

function createUser (fname, lname, bio) {
  return knex('User')
    .insert({
      first_name: fname,
      last_name: lname,
      bio: bio
    })
}

function createPlaylist (name, description) {
  return knex('Playlist')
    .insert({
      name: name,
      description: description
    })
}

function createUserPlaylistLink (userId, playlistId) {
  return knex('UserPlaylist')
    .insert({
      user_id: userId,
      playlist_id: playlistId
    })
}

// -----------------------------------------------------------------------------
// Schema Stuff
// -----------------------------------------------------------------------------

function createSchema () {
  return createUserTable()
    .then(createPlaylistTable)
    .then(createUserPlaylistTable)
    .then(function () {
      console.log('Tables created.')
    })
}

function createUserTable() {
  return knex.schema.hasTable('User').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('User', function(t) {
        t.increments('id').primary();
        t.string('first_name', 100);
        t.string('last_name', 100);
        t.text('bio');
      });
    }
  });
}

function createPlaylistTable () {
  return knex.schema.hasTable('Playlist').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('Playlist', function(t) {
        t.increments('id').primary();
        t.string('name', 100);
        t.string('description', 100);
      });
    }
  });
}

function createUserPlaylistTable () {
  return knex.schema.hasTable('UserPlaylist').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('UserPlaylist', function(t) {
        t.integer('user_id');
        t.integer('playlist_id');

        t.foreign('user_id').references('User.id')
        t.foreign('playlist_id').references('Playlist.id')
      });
    }
  });
}
