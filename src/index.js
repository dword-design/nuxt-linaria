import { omit } from '@dword-design/functions'

export default function () {
  this.extendBuild(config => {
    config.module.rules
      .find(({ test }) => test.test('.js'))
      .use
      .push({
        loader: require.resolve('linaria/loader'),
        options: {
          sourceMap: this.options.dev,
          babelOptions: this.options.build.babel |> omit('cacheDirectory'),
        },
      })
  })
}