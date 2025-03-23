import neostandard from 'neostandard'

export default neostandard({
  ts: true,
  ignores: [
    'lib',
    'packages/**/dist',
    'packages/puppeteer-server/public'
  ]
})
