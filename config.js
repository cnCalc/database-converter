module.exports = {
  mysql: {
    host: 'cncalc-ubuntu.lan',
    user: 'root',
    password: '123456',
    database: 'cncalc'
  },
  mongo: {
    url: 'mongodb://localhost:27017/cncalc'
  },
  memberProfile: {
    convert: true,          // ..
    cleanup: true,          // Delete all data in MongoDB.
    skipFourZero: true,     // Skip all users with empty brith{day|month|year} and gender.
    skipArchiveTable: false // Skip archived user.
  }
}
