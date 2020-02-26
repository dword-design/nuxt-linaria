import withLocalTmpDir from 'with-local-tmp-dir'
import outputFiles from 'output-files'
import portReady from 'port-ready'
import puppeteer from '@dword-design/puppeteer'
import kill from 'tree-kill-promise'
import { endent } from '@dword-design/functions'
import execa from 'execa'

let browser
let page

export default {
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  after: () => browser.close(),
  css: () => withLocalTmpDir(async () => {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          build: {
            babel: {
              configFile: '${require.resolve('@dword-design/babel-config')}',
            },
          },
          modules: [
            '${require.resolve('.')}',
          ],
        }
      `,
      'pages/index.js': endent`
        import { css } from 'linaria'

        export default {
          render: h => <div class={ ['foo', css\`background: red\`] }>Hello world</div>,
        }
      `,
    })
    await execa('nuxt', ['build'])
    const childProcess = execa('nuxt', ['start'])
    try {
      await portReady(3000)
      await page.goto('http://localhost:3000')
      const backgroundColor = await page.$eval('.foo', el => getComputedStyle(el).backgroundColor)
      expect(backgroundColor).toMatch('rgb(255, 0, 0)')
    } finally {
      await kill(childProcess.pid)
    }
  }),
}