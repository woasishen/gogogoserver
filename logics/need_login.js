module.exports = {
    createroom: function (socket, msg, msgId) {
        Client.hsetnx(RedisRooms, msg.name, msg.pwd, function (err, data) {
            if (err) {
                console.log("--err:" + err);
                socket.send(msgId, {err: err});
                return;
            }
            if (data == 0) {
                socket.send(msgId, {error: "roomename is already exist!!"});
                return;
            }
            Client.hset(RedisRoomSize, msg.name, msg.size, function (err, data) {
                if (err) {
                    console.log("--err:" + err);
                    socket.send(msgId, {err: err});
                    return;
                }
                socket.send(msgId, {succeed: true});
            });
        });
    },
    logout: function (socket, msg, msgId) {
        socket.__userName = null;
        socket.send(msgId, {succeed: true});
    },
    joinroom: function (socket, msg, msgId) {
        Client.hget(RedisRooms, msg.name, function (err, data) {
            if (err) {
                console.log("--erra:" + err);
                socket.send(msgId, {err: err});
                return;
            }
            if (data == null) {
                socket.send(msgId, {error: "room not exist"});
                return;
            }
            if (data != msg.pwd) {
                socket.send(msgId, {error: "password do not match"});
                return;
            }

            if (Rooms[msg.name]) {
                socket.join(msg.name);
                socket.send(msgId, {
                    succeed: true,
                    roomsteps: Rooms[msg.name].roomSteps,
                    roomsize: Rooms[msg.name].roomSize,
                });
                return
            }

            Client.hget(RedisRoomSteps, msg.name, function (err, steps) {
                if (err) {
                    console.log("--erra:" + err);
                    socket.send(msgId, {err: err});
                    return;
                }
                Client.hget(RedisRoomSize, msg.name, function (err, size) {
                    if (err) {
                        console.log("--erra:" + err);
                        socket.send(msgId, {err: err});
                        return;
                    }

                    var stepArray = JSON.parse(steps);
                    if (!stepArray){
                        stepArray = new Array();
                    }
                    var cellStatus = new Array();

                    for (var i = 0; i < size; i++){
                        cellStatus[i] = new Array();
                    }
                    for (var i = 0; i < stepArray.length; i++){
                        cellStatus[stepArray[i].x][stepArray[i].y] = stepArray[i].status;
                    }
                    Rooms[msg.name] = {
                        roomSteps: stepArray,
                        cellStatus: cellStatus,
                        roomSize: size,
                    };

                    socket.join(msg.name);
                    socket.send(msgId, {
                        succeed: true,
                        roomsteps: Rooms[msg.name].roomSteps,
                        roomsize: Rooms[msg.name].roomSize,
                    });
                });
            });
        });
    },
    leaveroom: function (socket, msg, msgId) {
        socket.leave();
        socket.send(msgId, {succeed: true});
    },
};