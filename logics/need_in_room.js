/**
 * Created by cifangyang on 2017/7/3.
 */
module.exports = {
    put: function (socket, msg, msgId, room) {
        var posInfo = msg.posinfo;
        if (room.cellStatus[posInfo.x][posInfo.y]){
            socket.send(msgId, {succeed: false});
            return;
        }
        room.cellStatus[posInfo.x][posInfo.y] = posInfo.status;
        room.roomSteps.push(posInfo);
        socket.broadcast(msgId, msg);
    },
    unput: function (socket, msg, msgId, room) {
        var step = room.roomSteps.pop();
        if (!step){
            socket.send(msgId, {succeed: false});
            return;
        }
        room.cellStatus[step.x][step.y] = null;
        socket.broadcast(msgId);
    },
    restart: function (socket, msg, msgId, room) {
        for (var i = 0; i < room.roomSize; i++){
            room.cellStatus[i].length = 0;
        }
        room.roomSteps.length = 0;
        socket.broadcast(msgId);
    },
    setroomsize: function (socket, msg, msgId, room) {
        Client.hset(RedisRoomSize, socket.__roomId, msg.size, function (err, data) {
            if (err){
                console.log("--err:" + err);
                socket.send(msgId, {err: err});
                return;
            }
            room.roomSize = msg.size;
            socket.broadcast(msgId, msg.size);
        });
    }
};