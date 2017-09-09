export NODE_ENV=production
export NODE_PATH=.
export SENDER_NAME=http

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

rm -f tmp/test.log

sudo pm2 start -f --log-date-format="YYYY-MM-DD HH:mm:ss" server.js -- 8080
sudo pm2 start -f --log-date-format="YYYY-MM-DD HH:mm:ss" server.js -- 8081
sudo pm2 start -f --log-date-format="YYYY-MM-DD HH:mm:ss" server.js -- 8082

sudo pm2 start -f --log-date-format="YYYY-MM-DD HH:mm:ss" libs/replayer.js -- bpi_12
sudo pm2 start -f --log-date-format="YYYY-MM-DD HH:mm:ss" libs/replayer.js -- bpi_17

# FIXME as otherwise works incorrectly
sleep 10
sudo pm2 restart 0
sudo pm2 restart 1
sudo pm2 restart 2
sudo pm2 restart 3
sudo pm2 restart 4
