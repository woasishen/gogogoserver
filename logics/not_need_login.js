require('./ConsoleLogErrorKeys');
require('./RedisCache');

function Add(cache, socket, msg, msgId){
    msg.time = Date.now();
    cache.add(msg);
    cache.stop++;
    socket.broadcast(msgId, {
        stop: cache.stop,
        data: msg
    });

    if(cache.length > cache.MaxLength){
        cache.TrySave(function () {
            var tempDelCount = cache.MaxLength - cache.DefaultLength;
            cache.splice(0, tempDelCount);
            cache.start = cache.start + tempDelCount;
        });
    }
}

function Delete(cache, socket, msg, msgId){
    if(cache.stop == -1){
        socket.send(msgId, {error: "no msg to delete"});
        return;
    }
    if(cache.stop != msg.stop){
        socket.send(msgId, {error: "cur stop not accordance"});
        return;
    }
    var dataJson = json.parse(cache.last());
    if (Date.now() - dataJson.time > DeleteLimitTime * 1000){
        socket.send(msgId, {error: "delete can only execute in " + DeleteLimitTime + " seconds"});
        return;
    }
    cache.pop();
    cache.stop--;
    socket.broadcast(msgId, {
        stop: cache.stop
    });

    if(cache.length < cache.MinLength && cache.start > 0){
        cache.TryGet();
    }
}

function Get(cache, socket, msg, msgId){
    if(msg.start < 0 || msg.stop < 0 || msg.stop < msg.start){
        socket.send(msgId, {error: "msg start or stop err:" + msg.start + "," + msg.stop});
        return;
    }

    if(msg.start >= cache.start){
        var tempSliceStart = msg.start - cache.start;
        var tempSliceLength = msg.stop - msg.start + 1;
        socket.send(msgId, cache.slice(tempSliceStart, tempSliceStart + tempSliceLength));
        return;
    }
    //无需缓存
    Client.lrange(cache.key, msg.start, msg.stop, function (err, data) {
        if (err) {
            console.log(RedisError + err);
            return;
        }
        socket.send(msgId, {
            succeed: true,
            data: json.parse(data)
        });
    });
}

module.exports = {
    get_eats: function (socket, msg, msgId) {
        Get(EatsCache ,socket, msg, msgId);
    },
    get_diapers: function (socket, msg, msgId) {
        Get(DiapersCache ,socket, msg, msgId);
    },
    add_eat: function (socket, msg, msgId) {
        Add(EatsCache, socket, msg, msgId);
    },
    add_diaper: function (socket, msg, msgId) {
        Add(DiapersCache, socket, msg, msgId);
    },
    del_eat: function (socket, msg, msgId) {
        Delete(EatsCache, socket, msg, msgId);
    },
    del_diaper: function (socket, msg, msgId) {
        Delete(DiapersCache, socket, msg, msgId);
    },
};