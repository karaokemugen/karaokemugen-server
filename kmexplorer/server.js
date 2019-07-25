const express = require('express')
const next = require('next')
const nextI18NextMiddleware = require('next-i18next/middleware')

const nextI18next = require('./i18n')

const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler();

// default DEV settings
var PORT = 3000;

process.argv.forEach( function(element, index) {
  if(element.indexOf('--port=')>=0)
  {
    PORT = parseInt(element.replace(/--port=(.*)/,'$1'));
  }
});
console.log(`KaraExplorer PORT = ${PORT}`);

(async () => {
  await app.prepare()
  const server = express()

  server.use(nextI18NextMiddleware(nextI18next))

  server.get('/kara/:slug/:id?', (req, res) => {
    const { query, params } = req
    return app.render(req, res, '/kara', { ...query, kid: params.id || params.slug })
  })
  server.get('/karas/:tagType/:tagSlug/:tagID?', (req, res) => {
    const { query, params } = req
    let q = 't:'+params.tagID 
    if(params.tagType=='year')
    {
      q = 'y:'+params.tagSlug 
    }
    else if(params.tagType=='serie')
    {
      q = 's:'+params.tagID 
    }
    return app.render(req, res, '/karas', { ...query, q: q })
  })
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  await server.listen(PORT)
  console.log('> Ready on http://localhost:'+PORT)
})()