var convict = require('convict');

var config = convict({
  app: {
    doc: "The applications.",
    format: ["website_cache"],
    default: "website_cache",
    env: "APPLICATION"
  },
  env: {
    doc: "The applicaton environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
  },
  ip: {
    doc: "The IP address to bind.",
    format: "ipaddress",
    default: "127.0.0.1",
    env: "IP_ADDRESS",
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 3000,
    env: "PORT"
  },
  redis: {
    doc: "Redis configurations.",
    format: "*",
    default: {
      server: "127.0.0.1",
      port: 6379,
      options: {}
    },
    env: "REDIS_CONFIG"
  }
});

var app = config.get('app');
config.loadFile('./configs/' + app + '.json');

// perform validation

config.validate();

module.exports = config;
