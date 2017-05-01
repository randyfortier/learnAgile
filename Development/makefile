#node
run:
	clear
	node app.js

runServer:
	node app.js > ./log/node.log &	

serverSd:
	kill $$(pidof node)


#Database
db:
	mongod --dbpath ./data/db --smallfiles --fork --logpath ./log/mongod.log --port 27018

dbAddJ:
	mongod --dbpath ./data/db --smallfiles

dbSd:	
	mongod --dbpath ./data/db --shutdown


#open in Editor
open:
	sublime app.js public/js/* views/*

stop: serverShutdown dbShutdown

#check status of server
status:	
	@echo "Server: $$(pidof node)"
	@echo "Database: $$(pidof mongod)"


#setup of git
addToGit:
	rm -r data/db/journal
	git add ../*

