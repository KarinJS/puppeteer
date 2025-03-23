import('./main/index')
  .then(module => module.main())
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
