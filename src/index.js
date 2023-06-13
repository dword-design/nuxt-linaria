export default function () {
  this.extendBuild(config => {
    const jsRule = config.module.rules.find(rule => rule.test.test('.js'))
    jsRule.use.push({
      loader: require.resolve('linaria/loader'),
      options: {
        sourceMap: this.options.dev,
      },
    })
  })
}
