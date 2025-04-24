function readPackage (pkg, context) {
  const map = {
    express: '@karinjs/express',
    log4js: '@karinjs/log4js',
    ws: '@karinjs/ws',
    'art-template': '@karinjs/art-template',
  }

  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach((dep) => {
      if (!map[dep]) return
      pkg.dependencies[dep] = `npm:${map[dep]}`
    })
  }

  if (pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach((dep) => {
      if (!map[dep]) return
      pkg.devDependencies[dep] = `npm:${map[dep]}`
    })
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
