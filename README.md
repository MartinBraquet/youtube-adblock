<!-- Do not modify this readme, it was automically generated based on the dynamic content in `readme/template.md`. -->

![](https://github.com/MartinBraquet/youtube-adblock/actions/workflows/main.yaml/badge.svg)

# YouTube Ad Skipper

This is a Mozilla Firefox Add-On Accelerating and Skipping YouTube Ads in Less Than a Second.

* **Real-time Acceleration**: Ads are sped up on the fly.
* **Auto-Skip**: Bypass ads as soon as they become skippable.

#### How it Works

A process, running when the current tab is `youtube.com/watch`, periodically checks the page content for ads. If there
is one, the process accelerates it by setting the playback rate to 1000. As soon as the `Skip Ads ->` button
shows up, the process clicks it. When the ad is skipped, the process increments a local private counter of skipped ads
in the browser.

#### Privacy and Security

* It does not make any other changes to the page.
* It does not collect any data.
* It does not store or retrieve any cookies.
* It stores the number of ads skipped in the local storage, which can only be read by the browser
  (this information is not accessible to anyone / anything else).

#### Demo

Note: Some ads in this demo are skipped so fast that it's difficult to notice them.

![](https://github.com/MartinBraquet/youtube-adblock/blob/main/demo/youtube-adblock-demo.gif?raw=true)

#### Statistics

|        **Users**         |        **Stars**         |         **Reviews**          |
|:------------------------:|:------------------------:|:----------------------------:|
| 3,627 | Rated 4.3 out of 5 | <a class="AddonMeta-reviews-content-link" href="https://addons.mozilla.org/en-US/firefox/addon/youtube_adblock/reviews/">18</a> |

## Installation

Install the extension

* at https://addons.mozilla.org/en-US/firefox/addon/youtube_adblock,
* or go to `Add-ons` and search for `Youtube AdBlock accelerates`.

Once installed, the extension will automatically and seamlessly take care of ads on YouTube.

## Development

### Prerequisites

* [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/)
* [Node.js](https://nodejs.org/en/download/): 20.9.0
* [npm](https://www.npmjs.com/get-npm): 10.1.0
* [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/): 7.8.0

Other versions might work, but have not been tested.

### Installation

1. Clone the repo

   ```sh
   git clone git@github.com:MartinBraquet/youtube-adblock.git
    ```
2. Install the prerequisites

   For Debian-based distributions:

   Install Node.js from these [instructions](https://deb.nodesource.com/).

   ```sh
   sudo apt install npm
   sudo npm install --global web-ext
   sudo npm install mustache jsdom
   ```

3. Run the extension
   ```sh
   web-ext run
   ```

### Debugging

1. Open the browser console

   ```sh
   Ctrl + Shift + I
   ```
   Or `about:debugging#/runtime/this-firefox` and click on `Inspect` to open the extension console.

### Build

1. Build the extension

   ```sh
   web-ext build --overwrite-dest --ignore-files demo martin readme package-lock.json
   ```

2. The extension is now available in the `web-ext-artifacts` folder as a .zip file.

### Release

[Submit](https://addons.mozilla.org) the .zip file to Mozilla for review and publication.

## Issue / Bug Report

Please open an [issue](https://github.com/MartinBraquet/youtube-adblock/issues).

## Upgrades / Fixes

Please open a [pull request](https://github.com/MartinBraquet/youtube-adblock/pulls).

## Disclaimer

This extension is not affiliated with YouTube or Google in any way.

This repo has not been tested on any other browser than Mozilla Firefox.
