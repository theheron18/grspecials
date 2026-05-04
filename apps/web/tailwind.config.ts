import type { Config } from 'tailwindcss'
import baseConfig from '@grspecials/config/tailwind'

const config: Config = {
  ...baseConfig,
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
}

export default config
