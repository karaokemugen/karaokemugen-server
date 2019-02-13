const express = require('express')
const next = require('next')
const nextI18NextMiddleware = require('next-i18next/middleware')

const nextI18next = require('./i18n')

const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler();

var PORT = 3000;

process.argv.forEach( function(element, index) {
  if(element.indexOf('--port=')>=0)
  {
    PORT = parseInt(element.replace(/.*--port=([0-9]+)/,'$1'));
  }
});
console.log(PORT);

(async () => {
  await app.prepare()
  const server = express()

  server.use(nextI18NextMiddleware(nextI18next))

  server.get('/kara/:id', (req, res) => {
    const { query, params } = req
    return app.render(req, res, '/kara', { ...query, kid: params.id })
  })
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  await server.listen(PORT)
  console.log('> Ready on http://localhost:'+PORT)
})()