module.exports = {
  mysql: {
    host: '::1',
    user: 'root',
    password: 'kasorameow',
    database: 'cncalc'
  },
  mongo: {
    url: 'mongodb://localhost:27017/cncalc'
  },
  memberProfile: {
    convert: true,          // ..
    cleanup: true,          // Delete all data in MongoDB.
    skipFourZero: false,    // Skip all users with empty brith{day|month|year} and gender.
    skipArchiveTable: false,// Skip archived user.
    assetPath: '/home/ntzyz/cncalc/serainTalk/'    
  },
  threadAndPost: {
    convert: true,
    cleanup: true,
    convertPost: true
  },
  attachment: {
    convert: true,
    cleanup: true,
  },
  pmMessage: {
    convert: true,
    cleanup: true,
  }
}
