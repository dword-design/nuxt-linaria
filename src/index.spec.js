import { endent } from '@dword-design/functions'
import puppeteer from '@dword-design/puppeteer'
import { outputFile } from 'fs-extra'
import { Builder, Nuxt } from 'nuxt'
import withLocalTmpDir from 'with-local-tmp-dir'

let browser
let page

export default {
  after: () => browser.close(),
  before: async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
  },
  css: () =>
    withLocalTmpDir(async () => {
      await outputFile(
        'pages/index.js',
        endent`
        import { css } from 'linaria'

        export default {
          render: h => <div class={ ['foo', css\`background: red\`] }>Hello world</div>,
        }

      `
      )
      const nuxt = new Nuxt({
        dev: false,
        modules: ['~/../src'],
      })
      await new Builder(nuxt).build()
      await nuxt.listen()
      try {
        await page.goto('http://localhost:3000')
        const $foo = await page.waitForSelector('.foo')
        const backgroundColor = await $foo.evaluate(
          el => getComputedStyle(el).backgroundColor
        )
        expect(backgroundColor).toMatch('rgb(255, 0, 0)')
      } finally {
        await nuxt.close()
      }
    }),
}
