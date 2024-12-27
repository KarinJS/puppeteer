const fs = require('fs')
const execSync = require('child_process').execSync

function readPackage (pkg, context) {
  // 如果packages/puppeteer-core/lib目录存在 则将@karinjs/puppeteer-core指向packages/puppeteer-core/lib
  if (pkg.dependencies['@karinjs/puppeteer-core']) {
    if (fs.existsSync('packages/puppeteer-core/lib')) {
      pkg.dependencies['@karinjs/puppeteer-core'] = 'file:../puppeteer-core'
      console.log('puppeteer-core指向本地目录')
    } else {
      // 否则版本号指向最新版本 不然会报错...
      const version = execSync('npm show @karinjs/puppeteer-core version').toString().trim()
      pkg.dependencies['@karinjs/puppeteer-core'] = version
      console.log(version)
    }
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
