rm -rf survival-game
mkdir survival-game
cp -r css dist pages noise img survival-game/
cp favicon.ico index.html README.md survival-game/
zip -r survival-game survival-game
rm -r survival-game