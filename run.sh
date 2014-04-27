
if [ $# -eq 0 ]
then
    node-supervisor -e 'html|js|css' server.js
else
    node-supervisor -e 'html|js|css' --exec node --debug server.js
fi
