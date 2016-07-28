run:
	clear
	node app.js

db:
	mongod --dbpath ./data/db --smallfiles

open:
	sublime app.js public/js/* views/*

addToGit:
	rm -r data/db/journal
	git add ../*