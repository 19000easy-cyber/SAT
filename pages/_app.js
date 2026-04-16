import '../styles.css'
import { I18nProvider } from '../lib/i18n'

export default function MyApp({ Component, pageProps }) {
  return (
    <I18nProvider>
      <Component {...pageProps} />
    </I18nProvider>
  )
}
