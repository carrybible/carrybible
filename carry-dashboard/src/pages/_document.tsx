import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link
            href="https://fonts.googleapis.com/css?family=Poppins&display=optional"
            rel="stylesheet"
          />
          <link href="/fonts/Poppins-SemiBold.ttf" rel="preload" as="font" />
        </Head>
        <body>
          <Main />
          <NextScript />
          <div id="loading-portal" style={{ zIndex: 9999 }} />
          <div id="overlay-highlight-portal" style={{ zIndex: 10000 }} />
        </body>
      </Html>
    )
  }
}

export default MyDocument
