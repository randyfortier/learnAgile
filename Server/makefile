#node
run:
	clear
	node app.js

runServer:
	node app.js > ./log/node.log &	

serverShutdown:
	kill $(pidof node)


#Database
db:
	mongod --dbpath ./data/db --smallfiles --fork --logpath ./log/mongod.log

dbShutdown:	
	mongod --dbpath ./data/db --shutdown


#open in Editor
open:
	sublime app.js public/js/* views/*


#setup of git
addToGit:
	rm -r data/db/journal
	git add ../*
