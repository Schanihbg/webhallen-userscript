# Changelog

## [1.1.1](https://github.com/Schanihbg/webhallen-userscript/compare/v1.1.0...v1.1.1) (2026-01-04)


### Bug Fixes

* Increase timeout limit from 10 seconds to 30 seconds ([f5dd3b3](https://github.com/Schanihbg/webhallen-userscript/commit/f5dd3b39912fe9a65eaf45141eb50851e194a36e))

## [1.1.0](https://github.com/Schanihbg/webhallen-userscript/compare/v1.0.1...v1.1.0) (2024-10-01)


### Features

* Add progress bar when processing reviews ([ee2eb5e](https://github.com/Schanihbg/webhallen-userscript/commit/ee2eb5e6e0db776d27d38c4d99fe8cc1998e981c))
* Clear all favorite stores ([ee2eb5e](https://github.com/Schanihbg/webhallen-userscript/commit/ee2eb5e6e0db776d27d38c4d99fe8cc1998e981c))
* Show user reviews (off by default) ([ee2eb5e](https://github.com/Schanihbg/webhallen-userscript/commit/ee2eb5e6e0db776d27d38c4d99fe8cc1998e981c))


### Bug Fixes

* Add 10 second timeout on all api requests ([ee2eb5e](https://github.com/Schanihbg/webhallen-userscript/commit/ee2eb5e6e0db776d27d38c4d99fe8cc1998e981c))
* Add warning label to setting toggles ([ee2eb5e](https://github.com/Schanihbg/webhallen-userscript/commit/ee2eb5e6e0db776d27d38c4d99fe8cc1998e981c))
* incorrect word wrap on reviews ([c84f48e](https://github.com/Schanihbg/webhallen-userscript/commit/c84f48ec304a69d4b1613be363f7d61b26f89450))
* make sort more readable ([fe66f63](https://github.com/Schanihbg/webhallen-userscript/commit/fe66f63e94c5107c1cdc4d387b7806c1d641319d))
* refactor inject and table building functions ([be9fa50](https://github.com/Schanihbg/webhallen-userscript/commit/be9fa501f0ca0af1999317f9c4fbf1eb74afde47))
* seperate actual reviews from missing reviews ([24d3c42](https://github.com/Schanihbg/webhallen-userscript/commit/24d3c4249038547f4d558a5996d0bd3dd0fe588e))
* show time in locale when hovering over review time ([54a297e](https://github.com/Schanihbg/webhallen-userscript/commit/54a297e216aaff3de478a512852d4347b7428296))
* sort reviews in descending order ([363a6fa](https://github.com/Schanihbg/webhallen-userscript/commit/363a6fa51d4fb92818a0b02e3a783b3261d2ad1e))
* typos ([627480c](https://github.com/Schanihbg/webhallen-userscript/commit/627480c54252b2282ec80556efff427942625e7b))
* warning page and button before getting user reviews ([113a6ca](https://github.com/Schanihbg/webhallen-userscript/commit/113a6ca75dd5526e091199d22fb306ed6a951c6c))

## [1.0.1](https://github.com/Schanihbg/webhallen-userscript/compare/v1.0.0...v1.0.1) (2024-02-06)


### Bug Fixes

* update [@update](https://github.com/update)Url ([96780fb](https://github.com/Schanihbg/webhallen-userscript/commit/96780fb3def742ef10bf7c61cb5a5c9948d08d20))

## 1.0.0 (2024-02-06)


### Features

* automatic updates 🙏 ([85551c0](https://github.com/Schanihbg/webhallen-userscript/commit/85551c0f6f2a5770dfa65d56166d989c9351a0b4))
* Userscript Settings to toggle different features ([f7719dc](https://github.com/Schanihbg/webhallen-userscript/commit/f7719dcdb88ee9d50d19f2d8ac523e6005a41ec6))


### Bug Fixes

* avoid refetching the orderlist for the same user ([1ba6083](https://github.com/Schanihbg/webhallen-userscript/commit/1ba60838e5412e397f11838687da1b24ce15daae))
* change var to let ([1c4e146](https://github.com/Schanihbg/webhallen-userscript/commit/1c4e146fcd9e492e4eea006ffeb963c0fa510dae))
* changed to URL object and proper fetch ([5085c0d](https://github.com/Schanihbg/webhallen-userscript/commit/5085c0dbb72c4a045c081abefca4549b80e94d29))
* fix bug with end date in categories ([1bbf21b](https://github.com/Schanihbg/webhallen-userscript/commit/1bbf21bacefd43a84bc81d083ef1a1631920cbcc))
* fix error in arrow function and formatting ([d3a71d6](https://github.com/Schanihbg/webhallen-userscript/commit/d3a71d628fc2ac439c627167d79553199ebae1f3))
* Fix killstreak cheevo logic ([e1badf3](https://github.com/Schanihbg/webhallen-userscript/commit/e1badf354574f1a704d9f0227acbbd905d17173f))
* Fixed issue with killstreak logic order ([96cf988](https://github.com/Schanihbg/webhallen-userscript/commit/96cf988c747dd4faa356ddae108ec16ca943af28))
* Fixed killstreak logic ([232d714](https://github.com/Schanihbg/webhallen-userscript/commit/232d714b3c990f541607ff16a534b6332296b6c7))
* Modified checkboxes to match webhallen style ([03bde4b](https://github.com/Schanihbg/webhallen-userscript/commit/03bde4b57b25d19d3a34b1c68fef2189270a218a))
* **perf:** only load charts css on stats page ([49b3fc9](https://github.com/Schanihbg/webhallen-userscript/commit/49b3fc930a031c7d0c08f771d7874509e2493797))
* sort pie chart legend descending ([8284aba](https://github.com/Schanihbg/webhallen-userscript/commit/8284aba1b5d67b1c1b0325a6135f8e17824f6956))
* **stats:** dont change the order of legend elements, just reverse it in presentation ([80cdfc6](https://github.com/Schanihbg/webhallen-userscript/commit/80cdfc6ea67c1a74c8e66fbf0561432a2493d4ab))
* **stats:** ignore non-store orders in store stats ([e183801](https://github.com/Schanihbg/webhallen-userscript/commit/e1838016b824f1b7c781aaa735817e967b7784da))
* **stats:** simplify calculating normalizedValue ([a15f90f](https://github.com/Schanihbg/webhallen-userscript/commit/a15f90fb32bad8b02aa0b272114ca36e759d7ab9))
* use await syntax rather than noop-catch when possible ([02f00e5](https://github.com/Schanihbg/webhallen-userscript/commit/02f00e5141420617acc27bebfc179b363d1f2c28))
