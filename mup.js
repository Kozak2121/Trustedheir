module.exports = {
  servers: {
    one: {
      host: '34.208.197.8',
      username: 'ubuntu',
      pem: '/home/oleksii/trustedheir_aws.pem'
      // password:
      // or leave blank for authenticate from ssh-agent
    }
  },

  meteor: {
    name: 'trustedheir',
    path: '../trustedheir',
    servers: {
      one: {}
    },
    buildOptions: {
      serverOnly: true,
    },
    docker: {
      image: 'abernix/meteord:base', // use this image if using Meteor 1.4+
      imageFrontendServer: 'meteorhacks/mup-frontend-server',
    },
    env: {
      ROOT_URL: 'https://app.trustedheir.com',
      MONGO_URL: '',
      MAIL_URL: ''
    },
    ssl: {
      crt: '', // this is a bundle of certificates
      key: '', // this is the private key of the certificate
      port: 443 // 443 is the default value and it's the standard HTTPS port
    },
    deployCheckWaitTime: 180,
    mongo: {
          oplog: true,
          port: 27017,
          servers: {
              one: {},
          },
      },
  }
};