// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"src/lib/p2p/rtc-video.vue":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
//
//
//
//
var _default = {
  props: {
    stream: {
      type: MediaStream,
      required: false
    }
  },
  watch: {
    stream: function stream() {
      this.$refs.video.srcObject = this.stream;
    }
  },
  mounted: function mounted() {
    this.$refs.video.srcObject = this.stream;
  },
  methods: {
    play: function play() {
      this.$refs.video.play();
    }
  }
};
exports.default = _default;
        var $ee3ad9 = exports.default || module.exports;
      
      if (typeof $ee3ad9 === 'function') {
        $ee3ad9 = $ee3ad9.options;
      }
    
        /* template */
        Object.assign($ee3ad9, (function () {
          var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("video", { ref: "video", attrs: { playsinline: "" } })
}
var staticRenderFns = []
render._withStripped = true

          return {
            render: render,
            staticRenderFns: staticRenderFns,
            _compiled: true,
            _scopeId: null,
            functional: undefined
          };
        })());
      
    /* hot reload */
    (function () {
      if (module.hot) {
        var api = require('vue-hot-reload-api');
        api.install(require('vue'));
        if (api.compatible) {
          module.hot.accept();
          if (!module.hot.data) {
            api.createRecord('$ee3ad9', $ee3ad9);
          } else {
            api.reload('$ee3ad9', $ee3ad9);
          }
        }

        
      }
    })();
},{"vue-hot-reload-api":"node_modules/vue-hot-reload-api/dist/index.js","vue":"node_modules/vue/dist/vue.runtime.esm.js"}],"src/views/Call.vue":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _vue = _interopRequireDefault(require("vue"));

var _p2p = require("../lib/p2p");

var _rtcVideo = _interopRequireDefault(require("../lib/p2p/rtc-video"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
var _default = {
  components: {
    CRoom: _p2p.Room,
    CRtcVideo: _rtcVideo.default
  },
  data: function data() {
    return {
      connected: false,
      username: ""
    };
  },
  watch: {
    "$refs.room.streams": function $refsRoomStreams() {
      console.log('Stream updated!');
      this.$refs.currentVideo.srcObject = this.$refs.room.streams[0];
    }
  },
  methods: {
    connect: function connect() {
      var _this = this;

      this.username = String(Math.random()) || prompt("Qual o seu nome?");
      this.$nextTick(function () {
        return _this.$refs.room.connect();
      });
    }
  }
};
exports.default = _default;
        var $ab6c18 = exports.default || module.exports;
      
      if (typeof $ab6c18 === 'function') {
        $ab6c18 = $ab6c18.options;
      }
    
        /* template */
        Object.assign($ab6c18, (function () {
          var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("c-room", {
    ref: "room",
    attrs: {
      "room-id": _vm.$route.params.id,
      username: _vm.username,
      "signaling-url": "https://btlyh.sse.codesandbox.io"
    },
    scopedSlots: _vm._u([
      {
        key: "default",
        fn: function(ref) {
          var connected = ref.connected
          var peers = ref.peers
          var streams = ref.streams
          return [
            _c("div", { attrs: { id: "call" } }, [
              _c("section", { staticClass: "left" }, [
                _c("div", { staticClass: "side-buttons" }, [
                  _c(
                    "div",
                    { staticClass: "title", attrs: { tabindex: "0" } },
                    [
                      _c("i", { staticClass: "mdi mdi-chat icon-large" }),
                      _vm._v(" "),
                      _c("span", [_vm._v("Mensagens")]),
                      _vm._v(" "),
                      _c("i", { staticClass: "arrow mdi mdi-chevron-down" }),
                      _vm._v(" "),
                      _c("ul", { staticClass: "title-dropdown" }, [
                        _c("li", { attrs: { tabindex: "-1" } }, [
                          _c("i", { staticClass: "mdi mdi-chat icon-large" }),
                          _vm._v(" "),
                          _c("span", [_vm._v("Mensagens")])
                        ]),
                        _vm._v(" "),
                        _c("li", { attrs: { tabindex: "-1" } }, [
                          _c("i", {
                            staticClass: "mdi mdi-attachment icon-large"
                          }),
                          _vm._v(" "),
                          _c("span", [_vm._v("Arquivos")])
                        ]),
                        _vm._v(" "),
                        _c("li", { attrs: { tabindex: "-1" } }, [
                          _c("i", {
                            staticClass: "mdi mdi-account-group icon-large"
                          }),
                          _vm._v(" "),
                          _c("span", [_vm._v("Pessoas")])
                        ])
                      ])
                    ]
                  )
                ]),
                _vm._v(" "),
                _c(
                  "ul",
                  { staticClass: "messages-list scrollbar" },
                  _vm._l(10, function(i) {
                    return _c("li", { key: i }, [
                      _c("strong", { staticClass: "username" }, [
                        _vm._v("Salomão Neto")
                      ]),
                      _vm._v(" "),
                      _c("p", { staticClass: "text" }, [
                        _vm._v(
                          "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Porro quis exercitationem, deserunt nihil odit suscipit! Amet laborum dolorem sequi. Nesciunt eveniet molestiae iste sit recusandae quo dignissimos placeat dolorum delectus?"
                        )
                      ]),
                      _vm._v(" "),
                      _c("time", { staticClass: "time" }, [_vm._v("11:00")])
                    ])
                  }),
                  0
                ),
                _vm._v(" "),
                _c(
                  "form",
                  {
                    staticClass: "composer",
                    on: {
                      submit: function($event) {
                        $event.preventDefault()
                      }
                    }
                  },
                  [
                    _c("textarea", {
                      attrs: { rows: "2", placeholder: "Escreva aqui..." }
                    })
                  ]
                )
              ]),
              _vm._v(" "),
              _c("div", { staticClass: "main-video" }, [
                _c("video", {
                  ref: "currentVideo",
                  staticClass: "main-video",
                  attrs: { playsinline: "", autoplay: "", muted: "" },
                  domProps: { muted: true }
                }),
                _vm._v(" "),
                _c("div", { staticClass: "action-buttons" }, [
                  _c(
                    "button",
                    {
                      staticClass: "action-button",
                      on: {
                        click: function($event) {
                          return _vm.$refs.room.getDisplayMedia()
                        }
                      }
                    },
                    [_c("i", { staticClass: "mdi mdi-monitor-screenshot" })]
                  ),
                  _vm._v(" "),
                  _c("button", { staticClass: "action-button" }, [
                    _c("i", { staticClass: "mdi mdi-microphone" })
                  ]),
                  _vm._v(" "),
                  _c("button", { staticClass: "action-button hangup" }, [
                    _c("i", { staticClass: "mdi mdi-phone-hangup" })
                  ]),
                  _vm._v(" "),
                  _c(
                    "button",
                    {
                      staticClass: "action-button",
                      on: {
                        click: function($event) {
                          return _vm.$refs.room.getUserMedia({
                            audio: true,
                            video: false
                          })
                        }
                      }
                    },
                    [_c("i", { staticClass: "mdi mdi-video" })]
                  ),
                  _vm._v(" "),
                  _c("button", { staticClass: "action-button" }, [
                    _c("i", { staticClass: "mdi mdi-fullscreen" })
                  ])
                ])
              ]),
              _vm._v(" "),
              _c(
                "div",
                { staticClass: "remote-medias scrollbar" },
                [
                  !connected
                    ? _c(
                        "button",
                        {
                          on: {
                            click: function($event) {
                              return _vm.connect()
                            }
                          }
                        },
                        [_vm._v("Conectar")]
                      )
                    : _vm._e(),
                  _vm._v(" "),
                  _vm._l(peers, function(peer, id) {
                    return _c(
                      "div",
                      { key: id, staticClass: "remote-media" },
                      _vm._l(streams[id], function(stream) {
                        return _c(
                          "c-rtc-video",
                          {
                            key: stream.id,
                            attrs: {
                              stream: stream,
                              autoplay: "",
                              muted: "",
                              playsinline: ""
                            }
                          },
                          [
                            _c("strong", { staticClass: "username" }, [
                              _vm._v(_vm._s(peer.name))
                            ])
                          ]
                        )
                      }),
                      1
                    )
                  })
                ],
                2
              )
            ])
          ]
        }
      }
    ])
  })
}
var staticRenderFns = []
render._withStripped = true

          return {
            render: render,
            staticRenderFns: staticRenderFns,
            _compiled: true,
            _scopeId: null,
            functional: undefined
          };
        })());
      
    /* hot reload */
    (function () {
      if (module.hot) {
        var api = require('vue-hot-reload-api');
        api.install(require('vue'));
        if (api.compatible) {
          module.hot.accept();
          if (!module.hot.data) {
            api.createRecord('$ab6c18', $ab6c18);
          } else {
            api.reload('$ab6c18', $ab6c18);
          }
        }

        
        var reloadCSS = require('_css_loader');
        module.hot.dispose(reloadCSS);
        module.hot.accept(reloadCSS);
      
      }
    })();
},{"vue":"node_modules/vue/dist/vue.runtime.esm.js","../lib/p2p":"src/lib/p2p/index.js","../lib/p2p/rtc-video":"src/lib/p2p/rtc-video.vue","_css_loader":"node_modules/parcel-bundler/src/builtins/css-loader.js","vue-hot-reload-api":"node_modules/vue-hot-reload-api/dist/index.js"}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "42617" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js"], null)
//# sourceMappingURL=/Call.53ab13ae.js.map