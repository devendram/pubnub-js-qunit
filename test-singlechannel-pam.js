var p, pub, sub, sec, chan, uuid, moduleName, authkey = null;


// Ensure Tests are run in order (all tests, not just failed ones)
QUnit.config.reorder = false;

QUnit.module( "PAM SINGLE CHANNEL", {
    setupOnce: function () {

        moduleName = QUnit.config.current.module.name;

        console.info("*** START :: " + moduleName);

        // PAM enabled keys
        pub = "pub-c-7127d5de-115a-4a6f-8f8f-012b63f2129c";
        sub = "sub-c-e8bf7cd2-904b-11e4-9852-02ee2ddab7fe";
        sec = "sec-c-YTI0MTEyY2UtNmQyNy00YjdlLWJiYjUtYjdlMjhhN2FmYTg0";

        uuid = PUBNUB.uuid();
        console.info("UUID: ", uuid);

    },
    setup: function () {
        chan = random_chars(6, 'chan');
        authkey = random_chars(6, 'auth');
    },
    teardown: function () {
        p = null;
    },
    teardownOnce: function () {

        console.info("*** DONE :: " + moduleName);
        console.log(" ");

        p = null;
    }
});

// ***************************************************************************** //

QUnit.test( "PAM 403-Forbidden Error Callback", function( assert ) {

    console.log("TEST:: " + QUnit.config.current.testName);

    console.info("\tChannel: ", chan);
    console.info("\tAuthKey: ", authkey);

    var done = assert.async();
    var timeout = null;
    var isSubscribed = false;

    console.log("\tPUBNUB INIT");
    p = PUBNUB.init({
        publish_key: pub,
        subscribe_key: sub,
        secret_key: sec,
        uuid: uuid,
        auth_key: authkey,
        error: function(msg) {
            console.error("\tPUBNUB ERROR: ", msg);
        }
    });

    p.grant({
        read: 0,
        write: 0,
        manage: 0,
        callback: function(m) {
            console.log("\tGRANT GLOBAL REVOKE CALLBACK: ", m);
            runTest();
        }
    });

    var runTest = function() {

        assert.ok(true, "Channel:  " + chan);
        assert.ok(true, "AuthKey:  " + authkey);

        var finalize = function(resultCode) {
            resultCode = _.isUndefined(resultCode) ? -1 : resultCode;

            if (resultCode === 1) {
                assert.ok(true, "Subscribe Error Callback Executed");
                clearTimeout(timeout);
            }
            else if (resultCode === -1) {
                assert.ok(false, "Timeout Reached, Subscribe Error Callback Not Executed");
            }
            else if (resultCode === -2) {
                assert.ok(false, "Unsubscribe Callback not called on Failed Subscribe then Unsubscribe (to stop retry)")
            }
            else if (resultCode === -3) {
                assert.ok(false, "Subscribe Succeeded without PAM 403 Exception, Should Not Happen")
            }

            else {
                assert.ok(false, "Unknown Result Code (Check Test Config)");
            }

            if (isSubscribed) {
                timeout = setTimeout(function() {
                    isSubscribed = false;
                    finalize(-2);
                });

                p.unsubscribe({
                    channel: chan,
                    callback: function() {
                        clearTimeout(timeout);
                        assert.ok(true, "Unsubscribe from Channel");
                        done();
                    }
                });
            }
            else {
                done();
            }

        };

        console.log("\tWAIT 5 SECONDS TO CHECK IF SUBSCRIBE ERROR CALLBACK EXECUTED");
        timeout = setTimeout(function() {
            finalize(-1);
        }, 5000);

        assert.ok(true, "Subscribe to " + chan + " with AuthKey " + authkey);
        assert.ok(true, "Wait for pubnub.subscribe -> error callback");

        // To Stop Retries
        isSubscribed = true;
        p.subscribe({
            channel: chan,
            message: function(msg) {
                console.log("\tMESSAGE: ", msg);
            },
            connect: function(msg) {
                console.log("\tCONNECTED: ", msg);
                finalize(-3);
            },
            error: function(msg) {
                console.log("\tSUBSCRIBE ERROR: ", msg);
                finalize(1);
            }
        });
    };

});

QUnit.test( "Grant Callback", function( assert ) {

    console.log("TEST:: " + QUnit.config.current.testName);

    var done = assert.async();
    var timeout = null;

    p = PUBNUB.init({
        publish_key: pub,
        subscribe_key: sub,
        secret_key: sec,
        uuid: uuid,
        error: function(msg) {
            console.error("\tPUBNUB ERROR: ", msg);
        }
    });

    assert.ok(true, "AuthKey:  " + authkey);
    assert.ok(true, "Channel:  " + chan);

    var finalize = function(resultCode) {
        resultCode = _.isUndefined(resultCode) ? -2 : resultCode;

        if (resultCode === 1) {
            assert.ok(true, "Grant Callback called");
            clearTimeout(timeout);
        }
        else if (resultCode === -1) {
            assert.ok(false, "Grant Error Callback Executed");
        }
        else if (resultCode === -2) {
            assert.ok(false, "Timeout Reached, Grant Callback Not Executed");
        }
        else {
            assert.ok(false, "Unknown Result Code (Check Test Config)");
        }

        done();
    };

    console.log("\tWAIT 5 SECONDS TO CHECK IF GRANT CALLBACK EXECUTED");
    timeout = setTimeout(function() {
        finalize(-2);
    }, 5000);

    assert.ok(true, "Grant Permissions to " + chan + " for AuthKey " + authkey + " TTL: 15 seconds");
    p.grant({
        channel: chan,
        auth_key: authkey,
        read: true,
        write: true,
        manage: true,
        ttl: 15,
        callback: function(msg) {
            console.log("\tGRANT: ", msg);
            finalize(1);
        },
        error: function(msg) {
            console.log("\tGRANT ERROR: ", msg);
            finalize(-1);
        }
    });

});

QUnit.test( "Write Permission Enabled, Publish Message", function( assert ) {

    console.log("TEST:: " + QUnit.config.current.testName);

    var done = assert.async();
    var timeout = null;

    p = PUBNUB.init({
        publish_key: pub,
        subscribe_key: sub,
        secret_key: sec,
        uuid: uuid,
        auth_key: authkey,
        error: function(msg) {
            console.error("\tPUBNUB ERROR: ", msg);
        }
    });

    assert.ok(true, "AuthKey:  " + authkey);
    assert.ok(true, "Channel:  " + chan);

    var finalize = function(resultCode) {
        resultCode = _.isUndefined(resultCode) ? -2 : resultCode;

        if (resultCode === 1) {
            assert.ok(true, "Publish Callback Executed");
            clearTimeout(timeout);
        }
        else if (resultCode === -1) {
            assert.ok(false, "Publish Error Callback Executed");
        }
        else if (resultCode === -2) {
            assert.ok(false, "Timeout Reached, Publish Callback Not Executed");
        }
        else {
            assert.ok(false, "Unknown Result Code (Check Test Config)");
        }
        done();
    };

    console.log("\tWAIT 6 SECONDS TO CHECK IF PUBLISH CALLBACK EXECUTED");
    timeout = setTimeout(function() {
        finalize(-2);
    }, 6000);

    window.rand = PUBNUB.uuid();

    var publish = function() {
        assert.ok(true, "Publish Message in 3 Seconds to Channel ", chan);
        setTimeout(function() {
            var message = {
                chan: chan,
                test: QUnit.config.current.testName,
                rand: window.rand
            };

            console.log("\tPUBLISH: ", message);
            p.publish({
                channel: chan,
                message: message,
                callback: function(msg) {
                    assert.ok(1 == "1", "Message Published to " + chan);
                    console.log("\tPUBLISHED: ", msg);
                    finalize(1);
                },
                error: function(msg) {
                    assert.ok(false, "Error in Publish");
                    console.log("\tPUBLISH ERROR: ", msg);
                    finalize(-1);
                }
            });
        }, 3000);
    };

    //assert.ok(true, "Subscribe to Channel after Grant", chan)
    //var subscribe = function() {
    //
    //};

    assert.ok(true, "Grant Write Only Permissions to " + chan + " for AuthKey " + authkey + " TTL: 15 seconds");
    p.grant({
        channel: chan,
        auth_key: authkey,
        read: false,
        write: true,
        manage: false,
        ttl: 15,
        callback: function(msg) {
            console.log("\tGRANT: ", msg);
            publish();
        },
        error: function(msg) {
            console.log("\tGRANT ERROR: ", msg);
        }
    });

});



QUnit.test( "Read/Write Permission Enabled, Publish/Subscribe Message", function( assert ) {

    console.log("TEST:: " + QUnit.config.current.testName);

    var done = assert.async();
    var timeout = null;
    var isSubscribed = false;

    p = PUBNUB.init({
        publish_key: pub,
        subscribe_key: sub,
        secret_key: sec,
        uuid: uuid,
        auth_key: authkey,
        error: function(msg) {
            console.error("\tPUBNUB ERROR: ", msg);
        }
    });

    assert.ok(true, "AuthKey:  " + authkey);
    assert.ok(true, "Channel:  " + chan);

    var finalize = function(resultCode) {
        resultCode = _.isUndefined(resultCode) ? -2 : resultCode;

        if (resultCode === 1) {
            assert.ok(true, "Subscribe Message Callback Executed, Received Message");
            clearTimeout(timeout);
        }
        else if (resultCode === -1) {
            assert.ok(false, "Grant Error Callback Executed");
        }
        else if (resultCode === -2) {
            assert.ok(false, "Subscribe Error Callback Executed");
        }
        else if (resultCode === -3) {
            assert.ok(false, "Publish Error Callback Executed");
        }
        else if (resultCode === -4) {
            assert.ok(false, "Timeout Reached, Subscribe Message Callback Not Executed");
        }
        else {
            assert.ok(false, "Unknown Result Code (Check Test Config)");
        }
        if (isSubscribed) {
            p.unsubscribe({
                channel: chan,
                callback: function() {
                    assert.ok(true, "Unsubscribe from Channel");
                    done();
                }
            });
        }
        else {
            done();
        }
    };

    console.log("\tWAIT UP TO 8 SECONDS TO CHECK IF SUBSCRIBE MESSAGE CALLBACK EXECUTED");
    timeout = setTimeout(function() {
        finalize(-4);
    }, 8000);

    window.rand = PUBNUB.uuid();

    var publish = function() {
        assert.ok(true, "Publish Message to Channel ", chan);
        setTimeout(function() {
            var message = {
                chan: chan,
                test: QUnit.config.current.testName,
                rand: window.rand
            };

            console.log("\tPUBLISH: ", message);
            p.publish({
                channel: chan,
                message: message,
                callback: function(msg) {
                    assert.ok(true, "Message Published to Channel: " + chan);
                    console.log("\tPUBLISHED: ", msg);
                },
                error: function(msg) {
                    assert.ok(false, "Error in Publish");
                    console.log("\tPUBLISH ERROR: ", msg);
                    finalize(-3);
                }
            });
        }, 500);
    };

    var subscribe = function() {
        assert.ok(true, "Subscribe to Channel after 2 seconds");
        setTimeout(function() {
            p.subscribe({
                channel: chan,
                connect: function() {
                    isSubscribed = true;
                    assert.ok(true, "Connected to PubNub on Channel: " + chan);
                    console.log("\tCONNECTED: ", chan);
                    publish();
                },
                message: function(msg) {
                    _.delay(function(msg){
                        assert.ok(true, "Message Received in Channel: " + chan);
                        console.log("\tMESSAGE: ", msg);
                        finalize(1);
                    }, 1000, msg);
                },
                error: function(msg) {
                    assert.ok(false, "Error in Subscribe");
                    console.log("\tSUBSCRIBE ERROR: ", msg);
                    finalize(-2);
                }
            });
        }, 2000);
    };

    assert.ok(true, "Grant Read/Write Permissions to Channel");
    p.grant({
        channel: chan,
        auth_key: authkey,
        read: true,
        write: true,
        manage: false,
        ttl: 15,
        callback: function(msg) {
            assert.ok(true, "Permissions Granted to Channel: " + chan  + " AuthKey: " + authkey);
            console.log("\tGRANT: ", msg);
            subscribe();
        },
        error: function(msg) {
            console.log("\tGRANT ERROR: ", msg);
            assert.ok(false, "")
            finalize(-1);
        }
    });

});