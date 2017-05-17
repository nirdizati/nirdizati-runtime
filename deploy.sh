export NODE_ENV=development
export NODE_PATH=.

sudo npm --loglevel=error install
cd src
sudo npm --loglevel=error install
gulp prod
cd ..

docker volume rm $(docker volume ls -qf dangling=true)
docker rm -f some-mongo some-redis
docker run --name some-mongo -d -p 27017:27017 mongo
docker run --name some-redis -d -p 6379:6379 redis redis-server --appendonly yes

sudo pm2 delete all
sudo pm2 start server.js
sudo pm2 start libs/replayer.js
