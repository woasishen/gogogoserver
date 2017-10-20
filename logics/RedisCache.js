/**
 * Created by Administrator on 2017/10/5.
 */
require('./RedisKeys');

function TrySave(finishDel) {
    if(finishDel){
        this.SaveDele.unshift(finishDel);
    }
    if(this.saving){
        this.tosave = true;
        return;
    }
    this.tosave = false;
    this.saving = true;
    this.Save();
}

function Save() {
    Client.llen(this.key, function (err, len) {
        if (err) {
            console.log(RedisError + err);
            this.SaveFinished();
            return;
        }
        //same
        if(len == this.stop + 1){
            this.SaveFinished();
            return;
        }
        //del
        if(len > this.stop + 1){
            Client.ltrim(this.key, len - this.stop - 1, len, function (err, data) {
                if (err) {
                    console.log(RedisError + err);
                }
                this.SaveFinished();
            });
            return
        }
        //push
        Client.lpush(this.key, this.slice(len - this.start), function (err, data) {
            if (err) {
                console.log(RedisError + err);
            }
            this.SaveFinished();
        });
    });
}

function SaveFinished() {
    this.saving = false;
    if(this.tosave){
        this.TrySave();
    }else{
        while(this.SaveDele.length > 0) {
            this.SaveDele.pop()();
        }
    }
}

function TryGet(finishDel) {
    if(finishDel){
        this.GetDele.unshift(finishDel);
    }
    if(this.getting){
        this.toget = true;
        return;
    }
    this.toget = false;
    this.getting = true;
    if(this.init){
        this.save(this.Get());
    }else{
        this.Get();
    }
}

function Get() {
    Client.llen(this.key, function (err, len) {
        if (err) {
            console.log(RedisError + err);
            this.GetFinished();
            return;
        }
        Client.lrange(this.key, len - cache.DefaultLength, len - 1, function (err, data) {
            if (err) {
                console.log(RedisError + err);
            }
            cache.clear();
            var tempData = json.parse(data);
            Array.prototype.push.apply(cache, tempData);
            if(!this.init){
                this.init = true;
                console.log("cache init:");
                console.log(cache);
            }
            this.GetFinished();
        });

    });
}

function GetFinished() {
    this.getting = false;
    if(this.toget){
        this.TryGet();
    }else{
        while(this.GetDele.length > 0){
            this.GetDele.pop()();
        }
    }
}

function InitCache(key) {
    var cache = [];
    cache.key = key;
    cache.init = false;

    cache.TrySave = TrySave;
    cache.Save = Save;
    cache.SaveFinished = SaveFinished;
    cache.SaveDele = [];

    cache.TryGet = TryGet;
    cache.Get = Get;
    cache.GetFinished = GetFinished;
    cache.GetDele = [];

    cache.MaxLength = 50;
    cache.DefaultLength = 45;
    cache.MinLength = 40;
    cache.start = -1;
    cache.stop = -1;

    cache.TryGet();

    setInterval(function(){
        cache.TrySave();
    }, 60000)
}

module.exports = function () {
    EatsCache = InitCache(EatKey);
    DiapersCache = InitCache(DiaperKey);
};
