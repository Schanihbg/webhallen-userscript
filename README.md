# Webhallen userscript

A collection of utilities that make it easier to compare products, aggregate purchase statistics, and more.

## Installation

1. First you'll need [Tampermonkey](https://www.tampermonkey.net/).
1. Navigate to [`webhallen.user.js` from our latest release](https://github.com/Schanihbg/webhallen-userscript/releases/latest/download/webhallen.user.js) which should open up Tampermonkey, prompting you to install the script.

## Usage

### Product comparisons

On category pages you'll see a small checkbox under each products name. Selecting two products will open up a modal that lets you compare their attributes side by side. Identical values are highlighted in green.

<details>
  <summary>Screenshots</summary>
  <img src="https://i.imgur.com/40zvidB.png" alt="Two products with their respective checkboxes for comparison focused">

  <img src="https://i.imgur.com/7ZhzgVx.png" alt="A table containing all the attributes for two selected products">
</details>


### Statistics

The member profile section of the site will have an additional page in the menu; Statistik. It will display your purchase history and metrics related to the achievement system.

<details>
  <summary>Screenshot</summary>
  <img src="https://i.imgur.com/IDRlmWp.png" alt="Screenshot of what the statistics page looks like, with various metrics and charts">
</details>

### Script settings

Some of the features can be toggled on and off, and you can access those settings by navigating to your Profile Settings page and scrolling to the bottom.

<details>
  <summary>Screenshot</summary>
  <img src="https://i.imgur.com/S2VaEfZ.png" alt="Screenshot of the rendered settings">
</details>

## Contributing

We use [release-please](https://github.com/googleapis/release-please) to manage releases, which means we use and rely on [Conventional Commit messages](https://www.conventionalcommits.org/) to aid us in versioning.
