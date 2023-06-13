import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import packageName from 'depcheck-package-name'
import { execaCommand } from 'execa'
import nuxtDevReady from 'nuxt-dev-ready'
import outputFiles from 'output-files'
import kill from 'tree-kill-promise'

export default tester(
  {
    async autoprefixer() {
      await outputFiles({
        'nuxt.config.js': endent`
          import self from '../src/index.js'

          export default {
            modules: [self],
          }
        `,
        'pages/index.vue': endent`
          <script>
          import { css } from 'linaria'

          export default {
            render: h => <div class={ css\`object-fit: cover\` }>Hello world</div>,
          }
          </script>
        `,
      })

      const nuxt = execaCommand('nuxt dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        expect(await this.page.content()).toMatch('-o-object-fit:cover')
      } finally {
        await kill(nuxt.pid)
      }
    },
    async 'postcss plugin'() {
      await outputFiles({
        'nuxt.config.js': endent`
          import self from '../src/index.js'

          export default {
            build: {
              postcss: {
                plugins: {
                  ['${packageName`postcss-hexrgba`}']: {},
                },
              },
            },
            modules: [self],
          }
        `,
        'pages/index.vue': endent`
          <script>
          import { css } from 'linaria'

          export default {
            render: h => <div class={ css\`background: rgba(#fff, .5)\` }>Hello world</div>,
          }
          </script>

        `,
      })

      const nuxt = execaCommand('nuxt dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')
        expect(await this.page.content()).toMatch(
          'background:rgba(255,255,255,.5)',
        )
      } finally {
        await kill(nuxt.pid)
      }
    },
    async template() {
      await outputFiles({
        'nuxt.config.js': endent`
          import self from '../src/index.js'

          export default {
            modules: [self],
          }
        `,
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
      })

      const nuxt = execaCommand('nuxt dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const $foo = await this.page.waitForSelector('.foo')

        const backgroundColor = await $foo.evaluate(
          el => getComputedStyle(el).backgroundColor,
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      } finally {
        await kill(nuxt.pid)
      }
    },
    async valid() {
      await outputFiles({
        'nuxt.config.js': endent`
          import self from '../src/index.js'

          export default {
            modules: [self],
          }
        `,
        'pages/index.vue': endent`
          <script>
          import { css } from 'linaria'

          export default {
            render: h => <div class={ ['foo', css\`background: red\`] }>Hello world</div>,
          }
          </script>
        `,
      })

      const nuxt = execaCommand('nuxt dev')
      try {
        await nuxtDevReady()
        await this.page.goto('http://localhost:3000')

        const $foo = await this.page.waitForSelector('.foo')

        const backgroundColor = await $foo.evaluate(
          el => getComputedStyle(el).backgroundColor,
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      } finally {
        await kill(nuxt.pid)
      }
    },
  },
  [testerPluginTmpDir(), testerPluginPuppeteer()],
)
