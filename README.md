<!-- Do not modify this readme, it was automatically generated based on the dynamic content in `readme/template.md`. -->

[![Readme](https://github.com/MartinBraquet/youtube-adblock/actions/workflows/readme_build.yaml/badge.svg)](https://github.com/MartinBraquet/youtube-adblock/actions/workflows/readme_build.yaml)
[![Release](https://github.com/MartinBraquet/youtube-adblock/actions/workflows/release.yaml/badge.svg)](https://github.com/MartinBraquet/youtube-adblock/actions/workflows/release.yaml)

# YouTube Ad Skipper

This is a Mozilla Firefox Add-On Accelerating and Skipping YouTube Ads in Two Seconds or Less.

* **Real-time Acceleration**: Ads are sped up on the fly.
* **Auto-Skip**: Bypass ads as soon as they become skippable.

#### How it Works

A process, running when the current tab is `youtube.com/watch`, periodically checks the page content for ads.
If there is one, the process mutes, hides and accelerates it.
As soon as the `Skip Ads ->` button shows up, the process clicks it.
When the ad is skipped, the process increments a local private counter of skipped ads in the browser.

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
| 4,501 | Rated 4.4 out of 5 | <a class="AddonMeta-reviews-content-link" href="https://addons.mozilla.org/en-US/firefox/addon/youtube_adblock/reviews/">34</a> |

## Installation

Install the extension

* at https://addons.mozilla.org/en-US/firefox/addon/youtube_adblock,
* or go to `Add-ons` and search for `Youtube AdBlock accelerates`.

Once installed, the extension will automatically and seamlessly take care of ads on YouTube.

### Locally

Alternatively, you can install the extension from a local folder.
This can be useful for easily testing a not-yet-published version of the extension, without having to set up
a development environment. For example, a pull request might be in progress to address a user issue, and we would like the user
to test the changes (without taking the risk to publish this version on the store).

To do so:

1. Obtain the extension source code locally: clone the relevant repo or download and extract its zip file (e.g., [here](https://github.com/MartinBraquet/youtube-adblock/archive/main.zip) for the main branch)

2. Navigate to `about:debugging#/runtime/this-firefox` in the Firefox URL search bar

3. Right next to `Temporary Extensions`, click on `Load Temporary Add-on...`

4. In the selection, click on any file in the root directory of the local extension


## Usage

The add-on should work seamlessly upon installation. 
However, it is possible that the default configuration creates issues (such as triggering the YouTube detection banner) for you, as YouTube provides different different user interfaces / experiences depending on the location, language, etc.

### Configurations

You are welcome to adjust the configurations in the extension's settings (click on the extension's icon in the browser's toolbar).
Description of each parameter:
* _Playback Rate_: the playback speed desired for the ad. The higher the playback rate, the faster the ad will end, but also the more likely YouTube will notice that an adblock has been used.
* _Mute Ad_: whether to mute the ad. When the playback rate is low, we can hear the sped-up ad sound; so it can be convenient to mute it.
* _Hide Ad_: whether to hide the ad by replacing it with a black screen while it is playing.
* _Boost After 2s_: whether to boost* the ad after 2 seconds.
* _If Skip Available_: action to perform when the "Skip Ad" button gets available. Options:
  * _Click Button_: click the button, the natural option.
  * _Boost Ad_: Boost* the ad.
  * _Do Nothing_: Do nothing.

*Boosting consists in setting the ad timestamp to the end, essentially ending it. This can't be done as soon as the ad starts, as YouTube would detect it.

### Avoid YouTube Detection

If YouTube detected that you used an adblock, you can do the following:

* Adjust the configurations defined above:
  * Reduce the playback rate (e.g., 4),
  * Turn OFF _Mute Ad_, _Hide Ad_ and _Boost After 2s_,
  * Set _If Skip Available_ to _Click Button_ or _Do Nothing_.
* Reload the page.
* If none of the above worked, write a feedback (see instructions at the end of this document).

## Development

### Prerequisites

* [Mozilla Firefox](https://www.mozilla.org/en-US/firefox/new/)
* [Node.js](https://nodejs.org/en/download/): 20.9.0
* [npm](https://www.npmjs.com/get-npm): 10.1.0
* [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/): 7.8.0

Other versions might work, but have not been tested.

### Set up environment

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
   web-ext build --overwrite-dest --ignore-files demo martin readme misc package-lock.json release.sh
   ```

2. The extension is now available in the `web-ext-artifacts` folder as a .zip file.

### Release

[Submit](https://addons.mozilla.org) the .zip file to Mozilla for review and publication.

Note: naturally, you won't be able to publish the same extension or overwrite the existing one.
If your extension diverges from the current one, you can change the extension's ID in the `manifest.json` file and publish
it as a new extension in your own account.

## Feedback

### Short Comments
Please write a [review](https://addons.mozilla.org/en-US/firefox/addon/youtube_adblock/reviews/) in the Firefox store.

### Issue / Bug Report / Feature Request
- If you have a GitHub account, open an <a href="https://github.com/MartinBraquet/youtube-adblock/issues">issue</a> here.
- Otherwise, write your feedback in this  <a href="https://forms.gle/c87fsmy3tG1MmJaLA">form</a>.

## Contributions

To provide upgrades or fixes, please open a [pull request](https://github.com/MartinBraquet/youtube-adblock/pulls).

## Disclaimer

This extension is not affiliated with YouTube or Google in any way.

This repo has not been tested on any other browser than Mozilla Firefox.
