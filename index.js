// https://stackoverflow.com/questions/60699738/how-to-start-node-js-server-on-each-system-boot-in-mac-and-windows

var watchman = require('fb-watchman');
var client = new watchman.Client();
var open = require("open-uri");
const readLastLines = require('read-last-lines');

const {
  exec
} = require('node:child_process');


var dir_of_interest = ""; // your synergy log-file folder
var hostIP = "http://127.0.0.1:12345";

client.capabilityCheck({
    optional: [],
    required: ['relative_root']
  },
  function(error, resp) {
    if (error) {
      console.log(error);
      client.end();
      return;
    }

    // Initiate the watch
    client.command(['watch-project', dir_of_interest],
      function(error, resp) {
        if (error) {
          console.error('Error initiating watch:', error);
          return;
        }

        // It is considered to be best practice to show any 'warning' or
        // 'error' information to the user, as it may suggest steps
        // for remediation
        if ('warning' in resp) {
          console.log('warning: ', resp.warning);
        }

        // `watch-project` can consolidate the watch for your
        // dir_of_interest with another watch at a higher level in the
        // tree, so it is very important to record the `relative_path`
        // returned in resp

        console.log('watch established on ', resp.watch,
          ' relative_path', resp.relative_path);
        make_subscription(client, resp.watch, resp.relative_path);
      });
  });


// `watch` is obtained from `resp.watch` in the `watch-project` response.
// `relative_path` is obtained from `resp.relative_path` in the
// `watch-project` response.
function make_subscription(client, watch, relative_path) {
  sub = {
    // Match any `.js` file in the dir_of_interest
    expression: ["allof", ["match", "*.log"]],
    // Which fields we're interested in
    fields: ["name", "size", "mtime_ms", "exists", "type"]
  };
  if (relative_path) {
    sub.relative_root = relative_path;
  }

  client.command(['subscribe', watch, 'mysubscription', sub],
    function(error, resp) {
      if (error) {
        // Probably an error in the subscription criteria
        console.error('failed to subscribe: ', error);
        return;
      }
      console.log('subscription ' + resp.subscribe + ' established');
    });

  // Subscription results are emitted via the subscription event.
  // Note that this emits for all subscriptions.  If you have
  // subscriptions with different `fields` you will need to check
  // the subscription name and handle the differing data accordingly.
  // `resp`  looks like this in practice:
  //
  // { root: '/private/tmp/foo',
  //   subscription: 'mysubscription',
  //   files: [ { name: 'node_modules/fb-watchman/index.js',
  //       size: 4768,
  //       exists: true,
  //       type: 'f' } ] }
  client.on('subscription', function(resp) {
    if (resp.subscription !== 'mysubscription') return;

    resp.files.forEach(function(file) {
      // convert Int64 instance to javascript integer
      const mtime_ms = +file.mtime_ms;
      var l;
      readLastLines.read(dir_of_interest + "/synergy.log", 3)
        .then((lines) => {
          if (lines.includes("leaving")) {
            console.log("leaving");
            exec('curl' + hostIP +'/trigger_named/?trigger_name=synergyoff', (err, output) => {
              // once the command has completed, the callback function is called
              if (err) {
                // log and return if we encounter an error
                console.error("could not execute command: ", err)
                return
              }
            })

          } else if (lines.includes("entering")) {
            console.log("entering");
            //open("btt://trigger_named/?trigger_name=synergyon");
            exec('curl' + hostIP +'/trigger_named/?trigger_name=synergyon', (err, output) => {
              // once the command has completed, the callback function is called
              if (err) {
                // log and return if we encounter an error
                console.error("could not execute command: ", err)
                return
              }
          }
          else if (lines.includes("disconnected")) {
            console.log("CLIENT DISCONNECTED");
            exec('curl' + hostIP +'/trigger_named/?trigger_name=synergyoff', (err, output) => {
              // once the command has completed, the callback function is called
              if (err) {
                // log and return if we encounter an error
                console.error("could not execute command: ", err)
                return
              }
            })
          }
        });

    });
  });
}
