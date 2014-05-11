#! /bin/bash
node-inspector --save-live-edit &
open "http://127.0.0.1:8080/debug?port=5858"
wait
