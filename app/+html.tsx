import { ScrollViewStyleReset } from 'expo-router/html';
// Resolve vector icon font assets at build time for web @font-face
// Note: These imports are Node-only (executed during static render)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ioniconsTtf = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fontAwesomeTtf = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf');

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  {/* Preload icon fonts for faster, reliable rendering */}
  <link rel="preload" href={ioniconsTtf} as="font" type="font/ttf" crossOrigin="anonymous" />
  <link rel="preload" href={fontAwesomeTtf} as="font" type="font/ttf" crossOrigin="anonymous" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
  <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
  {/* Ensure icon fonts are available via CSS on web */}
  <style dangerouslySetInnerHTML={{ __html: iconFontsCss }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

const iconFontsCss = `
@font-face {
  font-family: Ionicons;
  src: url(${ioniconsTtf}) format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: FontAwesome;
  src: url(${fontAwesomeTtf}) format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
