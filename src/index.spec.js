import { endent, mapValues } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import packageName from 'depcheck-package-name'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

let browser
let page

const runTest = config => () =>
  withLocalTmpDir(async () => {
    await outputFiles(config.files)

    const nuxt = new Nuxt({
      createRequire: 'native',
      dev: false,
      modules: ['~/../src'],
      ...config.nuxtConfig,
    })
    await new Builder(nuxt).build()
    await nuxt.listen()
    try {
      await page.goto('http://localhost:3000')
      await config.test()
    } finally {
      await nuxt.close()
    }
  })

export default {
  after: () => browser.close(),
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  ...({
    autoprefixer: {
      files: {
        'pages/index.vue': endent`
          <script>
          import { css } from 'linaria'

          export default {
            render: h => <div class={ css\`object-fit: cover\` }>Hello world</div>,
          }
          </script>

        `,
      },
      test: async () =>
        expect(await page.content()).toMatch('-o-object-fit:cover'),
    },
    'postcss plugin': {
      files: {
        'pages/index.vue': endent`
          <script>
          import { css } from 'linaria'

          export default {
            render: h => <div class={ css\`background: rgba(#fff, .5)\` }>Hello world</div>,
          }
          </script>

        `,
      },
      nuxtConfig: {
        build: {
          postcss: {
            plugins: {
              [packageName`postcss-hexrgba`]: {},
            },
          },
        },
      },
      test: async () =>
        expect(await page.content()).toMatch('background:hsla(0,0%,100%,.5)'),
    },
    template: {
      files: {
        'pages/index.vue': endent`
          <template>
            <div :class="['foo', style]">Hello world</div>
          </template>

          <script>
          import { css } from 'linaria'

          export default {
            computed: {
              style: () => css\`background: red\`,
            },
          }
          </script>

        `,
      },
      test: async () => {
        const $foo = await page.waitForSelector('.foo')

        const backgroundColor = await $foo.evaluate(
          el => getComputedStyle(el).backgroundColor,
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
    valid: {
      files: {
        'pages/index.vue': endent`
          <script>
          import { css } from 'linaria'

          export default {
            render: h => <div class={ ['foo', css\`background: red\`] }>Hello world</div>,
          }
          </script>

        `,
      },
      test: async () => {
        const $foo = await page.waitForSelector('.foo')

        const backgroundColor = await $foo.evaluate(
          el => getComputedStyle(el).backgroundColor,
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      },
    },
  } |> mapValues(runTest)),
}
