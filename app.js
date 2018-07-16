var require = meteorInstall({"server":{"methods":{"admin.js":["meteor/meteor","fibers/future","../collections","../constants","crypto","moment","stripe","node-schedule",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/admin.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Future = void 0;                                                                                                   // 1
module.import('fibers/future', {                                                                                       // 1
    "default": function (v) {                                                                                          // 1
        Future = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Assets = void 0,                                                                                                   // 1
    FutureEvents = void 0,                                                                                             // 1
    StripeSubscriptions = void 0;                                                                                      // 1
module.import('../collections', {                                                                                      // 1
    "Assets": function (v) {                                                                                           // 1
        Assets = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "FutureEvents": function (v) {                                                                                     // 1
        FutureEvents = v;                                                                                              // 1
    },                                                                                                                 // 1
    "StripeSubscriptions": function (v) {                                                                              // 1
        StripeSubscriptions = v;                                                                                       // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var ROLE = void 0,                                                                                                     // 1
    STATUS = void 0,                                                                                                   // 1
    TEMPLATES = void 0,                                                                                                // 1
    SECRET_KEY = void 0,                                                                                               // 1
    TEST_STRIPE_KEY = void 0;                                                                                          // 1
module.import('../constants', {                                                                                        // 1
    "ROLE": function (v) {                                                                                             // 1
        ROLE = v;                                                                                                      // 1
    },                                                                                                                 // 1
    "STATUS": function (v) {                                                                                           // 1
        STATUS = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "TEMPLATES": function (v) {                                                                                        // 1
        TEMPLATES = v;                                                                                                 // 1
    },                                                                                                                 // 1
    "SECRET_KEY": function (v) {                                                                                       // 1
        SECRET_KEY = v;                                                                                                // 1
    },                                                                                                                 // 1
    "TEST_STRIPE_KEY": function (v) {                                                                                  // 1
        TEST_STRIPE_KEY = v;                                                                                           // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var crypto = void 0;                                                                                                   // 1
module.import('crypto', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        crypto = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.import('moment', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var stripe = void 0;                                                                                                   // 1
module.import('stripe', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        stripe = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var stripe_test = stripe(TEST_STRIPE_KEY);                                                                             // 8
                                                                                                                       //
var schedule = require('node-schedule');                                                                               // 9
                                                                                                                       //
function encrypt(data) {                                                                                               // 11
    var cipher = crypto.createCipher('aes192', SECRET_KEY);                                                            // 12
    var crypted = cipher.update(data, 'utf8', 'hex');                                                                  // 13
    crypted += cipher.final('hex');                                                                                    // 14
    return crypted;                                                                                                    // 15
}                                                                                                                      // 16
                                                                                                                       //
function decrypt(data) {                                                                                               // 18
    var decipher = crypto.createDecipher('aes192', SECRET_KEY);                                                        // 19
    var decrypted = decipher.update(data, 'hex', 'utf8');                                                              // 20
    decrypted += decipher.final('utf8');                                                                               // 21
    return decrypted;                                                                                                  // 22
}                                                                                                                      // 23
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 25
    Meteor.methods({                                                                                                   // 26
        //-----------------------------------admin's methods-------------------------------------------------          // 28
        getEstatePlanners: function (query) {                                                                          // 29
            var estatePlannersExtended = [];                                                                           // 30
            var filterObject = {                                                                                       // 31
                sort: {                                                                                                // 32
                    createdAt: -1                                                                                      // 32
                }                                                                                                      // 32
            };                                                                                                         // 31
                                                                                                                       //
            if (query) {                                                                                               // 34
                filterObject.skip = query.skip;                                                                        // 35
                filterObject.limit = query.limit;                                                                      // 36
            }                                                                                                          // 37
                                                                                                                       //
            var estatePlanners = Meteor.users.find({                                                                   // 38
                'roles.0': ROLE.ESTATE_PLANNER                                                                         // 38
            }, filterObject).fetch();                                                                                  // 38
            var countOfAllItems = Meteor.users.find({                                                                  // 39
                'roles.0': ROLE.ESTATE_PLANNER                                                                         // 39
            }).fetch().length;                                                                                         // 39
            estatePlanners.forEach(function (estatePlanner) {                                                          // 40
                if (estatePlanner) {                                                                                   // 41
                    delete estatePlanner.services;                                                                     // 42
                    var totalClients = Meteor.users.find({                                                             // 43
                        estatePlannerId: estatePlanner._id,                                                            // 44
                        'roles.0': 'client'                                                                            // 45
                    }).fetch().length;                                                                                 // 43
                    var stripeSubscription = StripeSubscriptions.findOne({                                             // 47
                        estatePlannerId: estatePlanner._id                                                             // 47
                    });                                                                                                // 47
                                                                                                                       //
                    if (stripeSubscription) {                                                                          // 48
                        estatePlanner.billingStatus = stripeSubscription.billingStatus;                                // 49
                    }                                                                                                  // 50
                                                                                                                       //
                    estatePlannersExtended.push(Object.assign(estatePlanner, {                                         // 51
                        totalClients: totalClients                                                                     // 51
                    }));                                                                                               // 51
                }                                                                                                      // 52
            });                                                                                                        // 53
            return {                                                                                                   // 54
                estatePlanners: estatePlannersExtended,                                                                // 54
                countOfAllItems: countOfAllItems                                                                       // 54
            };                                                                                                         // 54
        },                                                                                                             // 55
        cancelEstatePlannerAccountImmediately: function (estatePlannerId, isKeptClientAccounts) {                      // 56
            var myFuture = new Future();                                                                               // 57
            Meteor.users.update({                                                                                      // 58
                _id: estatePlannerId                                                                                   // 58
            }, {                                                                                                       // 58
                $set: {                                                                                                // 59
                    dateOfClose: new Date(),                                                                           // 60
                    status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_CLOSED                                               // 61
                },                                                                                                     // 59
                $unset: {                                                                                              // 63
                    dateOfSuspension: 1                                                                                // 64
                }                                                                                                      // 63
            }, function (err, cb) {                                                                                    // 58
                if (err) {                                                                                             // 66
                    myFuture.throw(err);                                                                               // 67
                }                                                                                                      // 68
                                                                                                                       //
                var estatePlanner = Meteor.users.findOne({                                                             // 69
                    _id: estatePlannerId                                                                               // 69
                });                                                                                                    // 69
                                                                                                                       //
                if (estatePlanner) {                                                                                   // 70
                    var profile = estatePlanner.profile;                                                               // 71
                                                                                                                       //
                    if (isKeptClientAccounts) {                                                                        // 72
                        Email.send({                                                                                   // 73
                            from: 'jeff@trustedheir.com',                                                              // 74
                            to: estatePlanner.profile.email,                                                           // 75
                            headers: {                                                                                 // 76
                                'X-SMTPAPI': {                                                                         // 77
                                    'filters': {                                                                       // 78
                                        'templates': {                                                                 // 79
                                            'settings': {                                                              // 80
                                                'enable': 1,                                                           // 81
                                                'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_ACTIVE
                                            }                                                                          // 80
                                        }                                                                              // 79
                                    },                                                                                 // 78
                                    'sub': {                                                                           // 86
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]                  // 87
                                    }                                                                                  // 86
                                }                                                                                      // 77
                            }                                                                                          // 76
                        });                                                                                            // 73
                    } else {                                                                                           // 92
                        Email.send({                                                                                   // 93
                            from: 'jeff@trustedheir.com',                                                              // 94
                            to: estatePlanner.profile.email,                                                           // 95
                            headers: {                                                                                 // 96
                                'X-SMTPAPI': {                                                                         // 97
                                    'filters': {                                                                       // 98
                                        'templates': {                                                                 // 99
                                            'settings': {                                                              // 100
                                                'enable': 1,                                                           // 101
                                                'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_CLOSED
                                            }                                                                          // 100
                                        }                                                                              // 99
                                    },                                                                                 // 98
                                    'sub': {                                                                           // 106
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]                  // 107
                                    }                                                                                  // 106
                                }                                                                                      // 97
                            }                                                                                          // 96
                        });                                                                                            // 93
                    }                                                                                                  // 112
                                                                                                                       //
                    myFuture.return({                                                                                  // 113
                        message: "You've successfully suspended " + profile.firstName + " " + profile.lastName + " account"
                    });                                                                                                // 113
                } else {                                                                                               // 114
                    return myFuture.wait();                                                                            // 115
                }                                                                                                      // 116
            });                                                                                                        // 118
            return myFuture.wait();                                                                                    // 119
        },                                                                                                             // 120
        cancelEstatePlannerAccountOnDate: function (estatePlannerId, dateOfClose, isKeptClientAccounts) {              // 121
            var myFuture = new Future();                                                                               // 122
            Meteor.users.update({                                                                                      // 123
                _id: estatePlannerId                                                                                   // 123
            }, {                                                                                                       // 123
                $set: {                                                                                                // 124
                    dateOfClose: dateOfClose                                                                           // 125
                },                                                                                                     // 124
                $unset: {                                                                                              // 127
                    dateOfSuspension: 1                                                                                // 128
                }                                                                                                      // 127
            }, function (err, cb) {                                                                                    // 123
                if (err) {                                                                                             // 130
                    myFuture.throw(err);                                                                               // 131
                }                                                                                                      // 132
                                                                                                                       //
                var date = new Date(moment(dateOfClose).format('YYYY, M, D'));                                         // 133
                var futureEvent = {                                                                                    // 134
                    name: "Cancel Estate Planner " + estatePlannerId,                                                  // 135
                    type: 'Cancel Estate Planner',                                                                     // 136
                    createdAt: new Date(),                                                                             // 137
                    date: date,                                                                                        // 138
                    userId: estatePlannerId                                                                            // 139
                };                                                                                                     // 134
                FutureEvents.insert(futureEvent);                                                                      // 141
                var job = schedule.scheduleJob(futureEvent.name, futureEvent.date, Meteor.bindEnvironment(function () {
                    var myFuture = new Future();                                                                       // 143
                    Meteor.users.update({                                                                              // 144
                        _id: estatePlannerId                                                                           // 144
                    }, {                                                                                               // 144
                        $set: {                                                                                        // 144
                            status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_CLOSED                                       // 144
                        }                                                                                              // 144
                    }, function (err, cb) {                                                                            // 144
                        if (err) {                                                                                     // 145
                            myFuture.throw(err);                                                                       // 146
                        }                                                                                              // 147
                                                                                                                       //
                        var estatePlanner = Meteor.users.findOne({                                                     // 148
                            _id: estatePlannerId                                                                       // 148
                        });                                                                                            // 148
                                                                                                                       //
                        if (estatePlanner) {                                                                           // 149
                            var profile = estatePlanner.profile;                                                       // 150
                                                                                                                       //
                            if (isKeptClientAccounts) {                                                                // 151
                                Email.send({                                                                           // 152
                                    from: 'jeff@trustedheir.com',                                                      // 153
                                    to: estatePlanner.profile.email,                                                   // 154
                                    headers: {                                                                         // 155
                                        'X-SMTPAPI': {                                                                 // 156
                                            'filters': {                                                               // 157
                                                'templates': {                                                         // 158
                                                    'settings': {                                                      // 159
                                                        'enable': 1,                                                   // 160
                                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_ACTIVE
                                                    }                                                                  // 159
                                                }                                                                      // 158
                                            },                                                                         // 157
                                            'sub': {                                                                   // 165
                                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]          // 166
                                            }                                                                          // 165
                                        }                                                                              // 156
                                    }                                                                                  // 155
                                });                                                                                    // 152
                            } else {                                                                                   // 171
                                Email.send({                                                                           // 172
                                    from: 'jeff@trustedheir.com',                                                      // 173
                                    to: estatePlanner.profile.email,                                                   // 174
                                    headers: {                                                                         // 175
                                        'X-SMTPAPI': {                                                                 // 176
                                            'filters': {                                                               // 177
                                                'templates': {                                                         // 178
                                                    'settings': {                                                      // 179
                                                        'enable': 1,                                                   // 180
                                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_CLOSED
                                                    }                                                                  // 179
                                                }                                                                      // 178
                                            },                                                                         // 177
                                            'sub': {                                                                   // 185
                                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]          // 186
                                            }                                                                          // 185
                                        }                                                                              // 176
                                    }                                                                                  // 175
                                });                                                                                    // 172
                            }                                                                                          // 191
                                                                                                                       //
                            myFuture.return({                                                                          // 192
                                message: "You've successfully canceled " + profile.firstName + " " + profile.lastName + " account",
                                estatePlanner: estatePlanner                                                           // 194
                            });                                                                                        // 192
                        } else {                                                                                       // 196
                            return myFuture.wait();                                                                    // 197
                        }                                                                                              // 198
                    });                                                                                                // 199
                    return myFuture.wait();                                                                            // 200
                }));                                                                                                   // 201
                var estatePlanner = Meteor.users.findOne({                                                             // 202
                    _id: estatePlannerId                                                                               // 202
                });                                                                                                    // 202
                delete estatePlanner.services;                                                                         // 203
                myFuture.return({                                                                                      // 204
                    message: 'Account will cancel on the following date',                                              // 204
                    estatePlanner: estatePlanner                                                                       // 204
                });                                                                                                    // 204
            });                                                                                                        // 205
            return myFuture.wait();                                                                                    // 206
        },                                                                                                             // 207
        suspendEstatePlannerAccount: function (estatePlannerId) {                                                      // 208
            var myFuture = new Future();                                                                               // 209
            Meteor.users.update({                                                                                      // 210
                _id: estatePlannerId                                                                                   // 210
            }, {                                                                                                       // 210
                $set: {                                                                                                // 211
                    status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_SUSPENDED,                                           // 212
                    dateOfSuspension: new Date()                                                                       // 213
                },                                                                                                     // 211
                $unset: {                                                                                              // 215
                    dateOfClose: 1                                                                                     // 216
                }                                                                                                      // 215
            }, function (err, cb) {                                                                                    // 210
                if (err) {                                                                                             // 218
                    myFuture.throw(err);                                                                               // 219
                }                                                                                                      // 220
                                                                                                                       //
                var estatePlanner = Meteor.users.findOne({                                                             // 221
                    _id: estatePlannerId                                                                               // 221
                });                                                                                                    // 221
                delete estatePlanner.services;                                                                         // 222
                Email.send({                                                                                           // 223
                    from: 'jeff@trustedheir.com',                                                                      // 224
                    to: estatePlanner.profile.email,                                                                   // 225
                    headers: {                                                                                         // 226
                        'X-SMTPAPI': {                                                                                 // 227
                            'filters': {                                                                               // 228
                                'templates': {                                                                         // 229
                                    'settings': {                                                                      // 230
                                        'enable': 1,                                                                   // 231
                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_SUSPENDED                      // 232
                                    }                                                                                  // 230
                                }                                                                                      // 229
                            },                                                                                         // 228
                            'sub': {                                                                                   // 236
                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]                          // 237
                            }                                                                                          // 236
                        }                                                                                              // 227
                    }                                                                                                  // 226
                });                                                                                                    // 223
                myFuture.return({                                                                                      // 242
                    message: "You've successfully suspended account",                                                  // 242
                    estatePlanner: estatePlanner                                                                       // 242
                });                                                                                                    // 242
            });                                                                                                        // 243
            return myFuture.wait();                                                                                    // 244
        },                                                                                                             // 245
        reActivateEstatePlannerAccount: function (estatePlannerId) {                                                   // 246
            var myFuture = new Future();                                                                               // 247
            Meteor.users.update({                                                                                      // 248
                _id: estatePlannerId                                                                                   // 248
            }, {                                                                                                       // 248
                $set: {                                                                                                // 249
                    status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_ACTIVE                                               // 249
                },                                                                                                     // 249
                $unset: {                                                                                              // 250
                    dateOfClose: 1,                                                                                    // 250
                    dateOfSuspension: 1                                                                                // 250
                }                                                                                                      // 250
            }, function (err, cb) {                                                                                    // 248
                if (err) {                                                                                             // 252
                    myFuture.throw(err);                                                                               // 253
                }                                                                                                      // 254
                                                                                                                       //
                var futureEvent = FutureEvents.findOne({                                                               // 255
                    userId: estatePlannerId,                                                                           // 255
                    type: 'Cancel Estate Planner'                                                                      // 255
                });                                                                                                    // 255
                                                                                                                       //
                if (futureEvent) {                                                                                     // 256
                    var job = schedule.scheduledJobs[futureEvent.name];                                                // 257
                                                                                                                       //
                    if (job) {                                                                                         // 258
                        job.cancel();                                                                                  // 259
                        FutureEvents.remove({                                                                          // 260
                            _id: futureEvent._id                                                                       // 260
                        });                                                                                            // 260
                    }                                                                                                  // 261
                }                                                                                                      // 262
                                                                                                                       //
                var estatePlanner = Meteor.users.findOne({                                                             // 263
                    _id: estatePlannerId                                                                               // 263
                });                                                                                                    // 263
                delete estatePlanner.services;                                                                         // 264
                Email.send({                                                                                           // 265
                    from: 'jeff@trustedheir.com',                                                                      // 266
                    to: estatePlanner.profile.email,                                                                   // 267
                    headers: {                                                                                         // 268
                        'X-SMTPAPI': {                                                                                 // 269
                            'filters': {                                                                               // 270
                                'templates': {                                                                         // 271
                                    'settings': {                                                                      // 272
                                        'enable': 1,                                                                   // 273
                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_REACTIVATED                    // 274
                                    }                                                                                  // 272
                                }                                                                                      // 271
                            },                                                                                         // 270
                            'sub': {                                                                                   // 278
                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]                          // 279
                            }                                                                                          // 278
                        }                                                                                              // 269
                    }                                                                                                  // 268
                });                                                                                                    // 265
                myFuture.return({                                                                                      // 284
                    message: "You've successfully reactivated " + estatePlanner.profile.firstName + " " + estatePlanner.profile.lastName + " account",
                    estatePlanner: estatePlanner                                                                       // 286
                });                                                                                                    // 284
            });                                                                                                        // 288
            return myFuture.wait();                                                                                    // 289
        },                                                                                                             // 290
        closeAllClients: function (estatePlannerId) {                                                                  // 291
            var myFuture = new Future();                                                                               // 292
            var estatePlanner = Meteor.users.findOne({                                                                 // 293
                _id: estatePlannerId                                                                                   // 293
            });                                                                                                        // 293
            var profile = estatePlanner.profile;                                                                       // 294
            var clients = Meteor.users.find({                                                                          // 295
                estatePlannerId: estatePlannerId                                                                       // 295
            }).fetch();                                                                                                // 295
            var errors = [];                                                                                           // 296
            clients.forEach(function (client) {                                                                        // 297
                Meteor.users.update({                                                                                  // 298
                    _id: client._id                                                                                    // 298
                }, {                                                                                                   // 298
                    $set: {                                                                                            // 298
                        status: STATUS.numeric.CLIENT_ACCOUNT_DELETED                                                  // 298
                    }                                                                                                  // 298
                }, function (err, cb) {                                                                                // 298
                    if (err) {                                                                                         // 299
                        errors.push(err);                                                                              // 300
                    }                                                                                                  // 301
                                                                                                                       //
                    Email.send({                                                                                       // 302
                        from: 'jeff@trustedheir.com',                                                                  // 303
                        to: client.profile.email,                                                                      // 304
                        headers: {                                                                                     // 305
                            'X-SMTPAPI': {                                                                             // 306
                                'filters': {                                                                           // 307
                                    'templates': {                                                                     // 308
                                        'settings': {                                                                  // 309
                                            'enable': 1,                                                               // 310
                                            'template_id': TEMPLATES.CLIENT_ACCOUNT_CLOSED                             // 311
                                        }                                                                              // 309
                                    }                                                                                  // 308
                                },                                                                                     // 307
                                'sub': {                                                                               // 315
                                    '%ClientFirstName%': [client.profile.firstName],                                   // 316
                                    '%EstatePlannerFullName%': [profile.firstName + ' ' + profile.lastName]            // 317
                                }                                                                                      // 315
                            }                                                                                          // 306
                        }                                                                                              // 305
                    });                                                                                                // 302
                });                                                                                                    // 322
            });                                                                                                        // 323
                                                                                                                       //
            if (errors.length) {                                                                                       // 324
                myFuture.throw(errors[0]);                                                                             // 325
            }                                                                                                          // 326
                                                                                                                       //
            myFuture.return({                                                                                          // 327
                message: "You've closed all clients accounts of " + profile.firstName + " " + profile.lastName         // 327
            });                                                                                                        // 327
            return myFuture.wait();                                                                                    // 328
        } //-----------------------------------admin's methods-------------------------------------------------        // 329
                                                                                                                       //
    });                                                                                                                // 26
}                                                                                                                      // 333
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"client.js":["babel-runtime/helpers/typeof","meteor/meteor","fibers/future","../collections","../constants","crypto","moment","stripe","node-schedule",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/client.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Future = void 0;                                                                                                   // 1
module.import('fibers/future', {                                                                                       // 1
    "default": function (v) {                                                                                          // 1
        Future = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Assets = void 0,                                                                                                   // 1
    StripeSubscriptions = void 0,                                                                                      // 1
    FutureEvents = void 0;                                                                                             // 1
module.import('../collections', {                                                                                      // 1
    "Assets": function (v) {                                                                                           // 1
        Assets = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "StripeSubscriptions": function (v) {                                                                              // 1
        StripeSubscriptions = v;                                                                                       // 1
    },                                                                                                                 // 1
    "FutureEvents": function (v) {                                                                                     // 1
        FutureEvents = v;                                                                                              // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var ROLE = void 0,                                                                                                     // 1
    STATUS = void 0,                                                                                                   // 1
    TEMPLATES = void 0,                                                                                                // 1
    SECRET_KEY = void 0,                                                                                               // 1
    TEST_STRIPE_KEY = void 0;                                                                                          // 1
module.import('../constants', {                                                                                        // 1
    "ROLE": function (v) {                                                                                             // 1
        ROLE = v;                                                                                                      // 1
    },                                                                                                                 // 1
    "STATUS": function (v) {                                                                                           // 1
        STATUS = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "TEMPLATES": function (v) {                                                                                        // 1
        TEMPLATES = v;                                                                                                 // 1
    },                                                                                                                 // 1
    "SECRET_KEY": function (v) {                                                                                       // 1
        SECRET_KEY = v;                                                                                                // 1
    },                                                                                                                 // 1
    "TEST_STRIPE_KEY": function (v) {                                                                                  // 1
        TEST_STRIPE_KEY = v;                                                                                           // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var crypto = void 0;                                                                                                   // 1
module.import('crypto', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        crypto = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.import('moment', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var stripe = void 0;                                                                                                   // 1
module.import('stripe', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        stripe = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var stripe_test = stripe(TEST_STRIPE_KEY);                                                                             // 8
                                                                                                                       //
var schedule = require('node-schedule');                                                                               // 9
                                                                                                                       //
function encrypt(data) {                                                                                               // 11
    var cipher = crypto.createCipher('aes192', SECRET_KEY);                                                            // 12
    var crypted = cipher.update(data, 'utf8', 'hex');                                                                  // 13
    crypted += cipher.final('hex');                                                                                    // 14
    return crypted;                                                                                                    // 15
}                                                                                                                      // 16
                                                                                                                       //
function decrypt(data) {                                                                                               // 18
    var decipher = crypto.createDecipher('aes192', SECRET_KEY);                                                        // 19
    var decrypted = decipher.update(data, 'hex', 'utf8');                                                              // 20
    decrypted += decipher.final('utf8');                                                                               // 21
    return decrypted;                                                                                                  // 22
}                                                                                                                      // 23
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 25
    Meteor.methods({                                                                                                   // 26
        //-----------------------------------client's methods-------------------------------------------------         // 28
        /* findCompany: (query) => {                                                                                   // 30
         let Company = clearbit.Company;                                                                               //
         let myFuture = new Future();                                                                                  //
         Company.find({                                                                                                //
         "query" : {                                                                                                   //
         'domain' : "google.com"                                                                                       //
         }                                                                                                             //
         })                                                                                                            //
         .then(function (company) {                                                                                    //
         myFuture.return({company});                                                                                   //
         })                                                                                                            //
         .catch(Company.NotFoundError, function (err) {                                                                //
         console.log(err); // Company could not be found                                                               //
         })                                                                                                            //
         .catch(function (err) {                                                                                       //
         console.log('Bad/invalid request, unauthorized, Clearbit error, or failed request');                          //
         });                                                                                                           //
         return myFuture.wait();                                                                                       //
         },*/createClientCreated: function (client) {                                                                  //
            var myFuture = new Future();                                                                               // 50
            Meteor.users.update({                                                                                      // 51
                _id: client._id                                                                                        // 51
            }, {                                                                                                       // 51
                $set: {                                                                                                // 51
                    status: STATUS.numeric.CLIENT_ACCOUNT_CREATED                                                      // 51
                }                                                                                                      // 51
            }, function (err, cb) {                                                                                    // 51
                if (err) {                                                                                             // 52
                    myFuture.throw(err);                                                                               // 53
                }                                                                                                      // 54
                                                                                                                       //
                Email.send({                                                                                           // 55
                    from: 'jeff@trustedheir.com',                                                                      // 56
                    to: client.profile.email,                                                                          // 57
                    headers: {                                                                                         // 58
                        'X-SMTPAPI': {                                                                                 // 59
                            'filters': {                                                                               // 60
                                'templates': {                                                                         // 61
                                    'settings': {                                                                      // 62
                                        'enable': 1,                                                                   // 63
                                        'template_id': TEMPLATES.CLIENT_WELCOME                                        // 64
                                    }                                                                                  // 62
                                }                                                                                      // 61
                            },                                                                                         // 60
                            'sub': {                                                                                   // 68
                                '%FirstName%': [client.profile.firstName]                                              // 69
                            }                                                                                          // 68
                        }                                                                                              // 59
                    }                                                                                                  // 58
                });                                                                                                    // 55
                myFuture.return({                                                                                      // 74
                    message: 'You’ve successfully created your TrustedHeir account'                                    // 74
                });                                                                                                    // 74
            });                                                                                                        // 75
            return myFuture.wait();                                                                                    // 76
        },                                                                                                             // 77
        createTrusteeInvited: function (id, trustee, clientId) {                                                       // 78
            var myFuture = new Future();                                                                               // 79
            var tokenRecord = {                                                                                        // 80
                token: Random.secret(),                                                                                // 81
                email: trustee.email,                                                                                  // 82
                when: new Date(),                                                                                      // 83
                reason: 'enroll'                                                                                       // 84
            };                                                                                                         // 80
            var tokenClients = {                                                                                       // 86
                token: tokenRecord.token,                                                                              // 87
                clientId: clientId                                                                                     // 88
            };                                                                                                         // 86
            var client = Meteor.users.findOne({                                                                        // 90
                _id: clientId                                                                                          // 90
            });                                                                                                        // 90
            var urlWithToken = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'trustee/accept-reject');
            var enrollAccountUrl = urlWithToken + "?id=" + clientId;                                                   // 92
            Meteor.users.update({                                                                                      // 93
                _id: id                                                                                                // 93
            }, {                                                                                                       // 93
                $set: {                                                                                                // 94
                    status: STATUS.numeric.TRUSTEE_INVITED,                                                            // 95
                    'services.password.reset': tokenRecord,                                                            // 96
                    'emails.0.createdAt': new Date(),                                                                  // 97
                    'emails.0.currentEmail': true                                                                      // 98
                },                                                                                                     // 94
                $addToSet: {                                                                                           // 100
                    'services.tokenClients': tokenClients                                                              // 101
                }                                                                                                      // 100
            }, function (err, cb) {                                                                                    // 93
                if (err) {                                                                                             // 104
                    myFuture.throw(err);                                                                               // 105
                }                                                                                                      // 106
                                                                                                                       //
                Roles.addUsersToRoles(id, [ROLE.TRUSTEE]);                                                             // 107
                Email.send({                                                                                           // 108
                    from: 'jeff@trustedheir.com',                                                                      // 109
                    to: trustee.email,                                                                                 // 110
                    headers: {                                                                                         // 111
                        'X-SMTPAPI': {                                                                                 // 112
                            'filters': {                                                                               // 113
                                'templates': {                                                                         // 114
                                    'settings': {                                                                      // 115
                                        'enable': 1,                                                                   // 116
                                        'template_id': TEMPLATES.TRUSTEE_INVITE                                        // 117
                                    }                                                                                  // 115
                                }                                                                                      // 114
                            },                                                                                         // 113
                            'sub': {                                                                                   // 121
                                '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],                  // 122
                                '%ClientFirstName%': [client.profile.firstName],                                       // 123
                                '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],        // 124
                                '%TrusteeFirstName%': [trustee.profile.firstName],                                     // 125
                                '%ClientNotes%': [trustee.profile.note]                                                // 126
                            }                                                                                          // 121
                        }                                                                                              // 112
                    }                                                                                                  // 111
                });                                                                                                    // 108
                var date = new Date(moment(new Date().setDate(new Date().getDate() + 3)).format('YYYY, M, D'));        // 132
                var futureEvent3 = {                                                                                   // 133
                    name: "Trustee 3-day Follow-up " + id,                                                             // 134
                    type: 'Trustee 3-day Follow-up',                                                                   // 135
                    createdAt: new Date(),                                                                             // 136
                    date: date,                                                                                        // 137
                    userId: id                                                                                         // 138
                };                                                                                                     // 133
                FutureEvents.insert(futureEvent3);                                                                     // 140
                var job3 = schedule.scheduleJob(futureEvent3.name, futureEvent3.date, Meteor.bindEnvironment(function () {
                    var myFuture = new Future();                                                                       // 142
                    var trustee = Meteor.users.findOne({                                                               // 143
                        _id: id                                                                                        // 143
                    });                                                                                                // 143
                    FutureEvents.remove({                                                                              // 144
                        name: "Trustee 3-day Follow-up " + id                                                          // 144
                    });                                                                                                // 144
                                                                                                                       //
                    if (trustee.status === STATUS.numeric.TRUSTEE_INVITED) {                                           // 145
                        Email.send({                                                                                   // 146
                            from: 'jeff@trustedheir.com',                                                              // 147
                            to: trustee.profile.email,                                                                 // 148
                            headers: {                                                                                 // 149
                                'X-SMTPAPI': {                                                                         // 150
                                    'filters': {                                                                       // 151
                                        'templates': {                                                                 // 152
                                            'settings': {                                                              // 153
                                                'enable': 1,                                                           // 154
                                                'template_id': TEMPLATES.TRUSTEE_THREE_DAY_FOLLOW_UP                   // 155
                                            }                                                                          // 153
                                        }                                                                              // 152
                                    },                                                                                 // 151
                                    'sub': {                                                                           // 159
                                        '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],          // 160
                                        '%TrusteeFirstName%': [trustee.profile.firstName],                             // 161
                                        '%ClientFirstName%': [client.profile.firstName]                                // 162
                                    }                                                                                  // 159
                                }                                                                                      // 150
                            }                                                                                          // 149
                        });                                                                                            // 146
                                                                                                                       //
                        var _date = new Date(moment(new Date().setDate(new Date().getDate() + 4)).format('YYYY, M, D'));
                                                                                                                       //
                        var futureEvent7 = {                                                                           // 168
                            name: "Trustee 7-day Follow-up " + id,                                                     // 169
                            type: 'Trustee 7-day Follow-up',                                                           // 170
                            createdAt: new Date(),                                                                     // 171
                            date: _date,                                                                               // 172
                            userId: id                                                                                 // 173
                        };                                                                                             // 168
                        FutureEvents.insert(futureEvent7);                                                             // 175
                        var job7 = schedule.scheduleJob(futureEvent7.name, futureEvent7.date, Meteor.bindEnvironment(function () {
                            var myFuture = new Future();                                                               // 177
                            var trustee = Meteor.users.findOne({                                                       // 178
                                _id: id                                                                                // 178
                            });                                                                                        // 178
                            FutureEvents.remove({                                                                      // 179
                                name: "Trustee 7-day Follow-up " + id                                                  // 179
                            });                                                                                        // 179
                                                                                                                       //
                            if (trustee.status === STATUS.numeric.TRUSTEE_INVITED) {                                   // 180
                                Email.send({                                                                           // 181
                                    from: 'jeff@trustedheir.com',                                                      // 182
                                    to: trustee.profile.email,                                                         // 183
                                    headers: {                                                                         // 184
                                        'X-SMTPAPI': {                                                                 // 185
                                            'filters': {                                                               // 186
                                                'templates': {                                                         // 187
                                                    'settings': {                                                      // 188
                                                        'enable': 1,                                                   // 189
                                                        'template_id': TEMPLATES.TRUSTEE_SEVEN_DAY_FOLLOW_UP           // 190
                                                    }                                                                  // 188
                                                }                                                                      // 187
                                            },                                                                         // 186
                                            'sub': {                                                                   // 194
                                                '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],  // 195
                                                '%TrusteeFirstName%': [trustee.profile.firstName],                     // 196
                                                '%ClientFirstName%': [client.profile.firstName]                        // 197
                                            }                                                                          // 194
                                        }                                                                              // 185
                                    }                                                                                  // 184
                                });                                                                                    // 181
                            }                                                                                          // 203
                                                                                                                       //
                            return myFuture.wait();                                                                    // 204
                        }));                                                                                           // 205
                    }                                                                                                  // 206
                                                                                                                       //
                    return myFuture.wait();                                                                            // 207
                }));                                                                                                   // 208
                myFuture.return({                                                                                      // 210
                    message: "You've successfully added " + trustee.profile.firstName + " " + trustee.profile.lastName + " as a new trustee. TrustedHeir will email your trustee and will guide them through creating their digital estate plan."
                });                                                                                                    // 210
            });                                                                                                        // 211
            return myFuture.wait();                                                                                    // 212
        },                                                                                                             // 213
        getAssetsOfTrustee: function (trusteeId, clientId, query) {                                                    // 214
            var trustee = Meteor.users.findOne({                                                                       // 215
                _id: trusteeId                                                                                         // 215
            });                                                                                                        // 215
                                                                                                                       //
            if (trustee && trustee.assetId) {                                                                          // 216
                var _ret = function () {                                                                               // 216
                    var finalAssets = [];                                                                              // 217
                    var filterObject = {                                                                               // 218
                        sort: {                                                                                        // 219
                            createdAt: -1                                                                              // 219
                        }                                                                                              // 219
                    };                                                                                                 // 218
                                                                                                                       //
                    if (query) {                                                                                       // 221
                        filterObject.skip = query.skip;                                                                // 222
                        filterObject.limit = query.limit;                                                              // 223
                    }                                                                                                  // 224
                                                                                                                       //
                    var assets = Assets.find({                                                                         // 225
                        _id: {                                                                                         // 225
                            $in: trustee.assetId                                                                       // 225
                        },                                                                                             // 225
                        status: {                                                                                      // 225
                            $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                  // 225
                        }                                                                                              // 225
                    }, filterObject).fetch();                                                                          // 225
                    var countOfAllItems = Assets.find({                                                                // 226
                        _id: {                                                                                         // 226
                            $in: trustee.assetId                                                                       // 226
                        },                                                                                             // 226
                        status: {                                                                                      // 226
                            $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                  // 226
                        }                                                                                              // 226
                    }).fetch().length;                                                                                 // 226
                    assets.forEach(function (asset) {                                                                  // 227
                        "use strict";                                                                                  // 228
                                                                                                                       //
                        if (asset.clientId === clientId) {                                                             // 229
                            (function () {                                                                             // 229
                                var trustees = [];                                                                     // 230
                                asset.name = decrypt(asset.name);                                                      // 231
                                asset.login = decrypt(asset.login);                                                    // 232
                                asset.password = decrypt(asset.password);                                              // 233
                                asset.password = asset.password.replace(/./g, '*');                                    // 234
                                asset.website = decrypt(asset.website);                                                // 235
                                asset.trusteeId.forEach(function (trusteeId) {                                         // 236
                                    var clientTrustee = Meteor.users.findOne({                                         // 237
                                        _id: trusteeId                                                                 // 237
                                    });                                                                                // 237
                                    trustees.push(clientTrustee);                                                      // 238
                                });                                                                                    // 239
                                finalAssets.push(Object.assign(asset, {                                                // 240
                                    trustees: trustees                                                                 // 240
                                }));                                                                                   // 240
                            })();                                                                                      // 229
                        }                                                                                              // 241
                    });                                                                                                // 242
                    return {                                                                                           // 243
                        v: {                                                                                           // 243
                            finalAssets: finalAssets,                                                                  // 243
                            trustee: trustee,                                                                          // 243
                            countOfAllItems: countOfAllItems                                                           // 243
                        }                                                                                              // 243
                    };                                                                                                 // 243
                }();                                                                                                   // 216
                                                                                                                       //
                if ((typeof _ret === "undefined" ? "undefined" : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
            } else {                                                                                                   // 244
                return {                                                                                               // 245
                    trustee: trustee                                                                                   // 245
                };                                                                                                     // 245
            }                                                                                                          // 246
        },                                                                                                             // 247
        // getAssetsOfTrustee: (trusteeId) => {                                                                        // 248
        //     let assets = [];                                                                                        // 249
        //     let finalAssets = [];                                                                                   // 250
        //     let trustee = Meteor.users.findOne({_id: trusteeId});                                                   // 251
        //     assets = Assets.find({trusteeId: { $in: [trusteeId] }, status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}}, {sort: {createdAt: -1}}).fetch();
        //     assets.forEach(asset => {                                                                               // 253
        //         asset.name = decrypt(asset.name);                                                                   // 254
        //         asset.login = 'hidden';                                                                             // 255
        //         asset.password = 'hidden';                                                                          // 256
        //         asset.website = decrypt(asset.website);                                                             // 257
        //         let trustees = [];                                                                                  // 258
        //         if (asset.trusteeId) {                                                                              // 259
        //             asset.trusteeId.forEach(id => {                                                                 // 260
        //                 "use strict";                                                                               // 261
        //                 let trustee = Meteor.users.findOne({_id: id});                                              // 262
        //                 delete trustee.services;                                                                    // 263
        //                 trustees.push(trustee);                                                                     // 264
        //             });                                                                                             // 265
        //         }                                                                                                   // 266
        //         finalAssets.push(Object.assign(asset, {trustees: trustees}));                                       // 267
        //     });                                                                                                     // 268
        //     return {finalAssets, trustee};                                                                          // 269
        // },                                                                                                          // 270
        addExistingTrustee: function (trustee, clientId) {                                                             // 271
            "use strict";                                                                                              // 272
                                                                                                                       //
            var myFuture = new Future();                                                                               // 273
            var existingTrustee = Accounts.findUserByEmail(trustee.email);                                             // 274
            var clientIds = existingTrustee.clientId;                                                                  // 275
                                                                                                                       //
            if (existingTrustee.roles[0] !== ROLE.TRUSTEE) {                                                           // 276
                myFuture.return({                                                                                      // 277
                    message: "This user cannot be added as your trustee"                                               // 277
                });                                                                                                    // 277
            } else if (clientIds && clientIds.includes(clientId)) {                                                    // 278
                myFuture.return({                                                                                      // 279
                    message: "You've already added this trustee"                                                       // 279
                });                                                                                                    // 279
            } else {                                                                                                   // 280
                (function () {                                                                                         // 280
                    var client = Meteor.users.findOne({                                                                // 281
                        _id: clientId                                                                                  // 281
                    });                                                                                                // 281
                    var tokenRecord = {};                                                                              // 282
                                                                                                                       //
                    if (existingTrustee.emails[0].verified) {                                                          // 283
                        tokenRecord = {                                                                                // 284
                            token: Random.secret(),                                                                    // 285
                            clientId: clientId                                                                         // 286
                        };                                                                                             // 284
                    } else {                                                                                           // 288
                        tokenRecord = {                                                                                // 289
                            token: existingTrustee.services.password.reset.token,                                      // 290
                            clientId: clientId                                                                         // 291
                        };                                                                                             // 289
                    }                                                                                                  // 293
                                                                                                                       //
                    var urlWithToken = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'trustee/accept-reject');
                    var enrollAccountUrl = urlWithToken + "?id=" + clientId;                                           // 295
                    Meteor.users.update({                                                                              // 296
                        _id: existingTrustee._id                                                                       // 296
                    }, {                                                                                               // 296
                        $addToSet: {                                                                                   // 297
                            'services.tokenClients': tokenRecord                                                       // 298
                        }                                                                                              // 297
                    }, function (err, cb) {                                                                            // 296
                        if (err) {                                                                                     // 301
                            myFuture.throw(err);                                                                       // 302
                        }                                                                                              // 303
                                                                                                                       //
                        Email.send({                                                                                   // 304
                            from: 'jeff@trustedheir.com',                                                              // 305
                            to: existingTrustee.profile.email,                                                         // 306
                            headers: {                                                                                 // 307
                                'X-SMTPAPI': {                                                                         // 308
                                    'filters': {                                                                       // 309
                                        'templates': {                                                                 // 310
                                            'settings': {                                                              // 311
                                                'enable': 1,                                                           // 312
                                                'template_id': TEMPLATES.TRUSTEE_INVITE                                // 313
                                            }                                                                          // 311
                                        }                                                                              // 310
                                    },                                                                                 // 309
                                    'sub': {                                                                           // 317
                                        '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],          // 318
                                        '%ClientFirstName%': [client.profile.firstName],                               // 319
                                        '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],
                                        '%TrusteeFirstName%': [existingTrustee.profile.firstName],                     // 321
                                        '%ClientNotes%': [existingTrustee.profile.note]                                // 322
                                    }                                                                                  // 317
                                }                                                                                      // 308
                            }                                                                                          // 307
                        });                                                                                            // 304
                        myFuture.return({                                                                              // 327
                            message: "You've successfully added " + existingTrustee.profile.firstName + " " + existingTrustee.profile.lastName + " as a new trustee. TrustedHeir will email your trustee and will guide them through creating their digital estate plan.",
                            existingTrustee: existingTrustee                                                           // 329
                        });                                                                                            // 327
                    });                                                                                                // 331
                })();                                                                                                  // 280
            }                                                                                                          // 332
                                                                                                                       //
            return myFuture.wait();                                                                                    // 333
        },                                                                                                             // 334
        addTrusteeDigitalAsset: function (trusteesIds, assetId) {                                                      // 335
            var myFuture = new Future();                                                                               // 336
            var errors = [];                                                                                           // 337
            trusteesIds.forEach(function (trusteeId) {                                                                 // 338
                Meteor.users.update({                                                                                  // 339
                    _id: trusteeId                                                                                     // 339
                }, {                                                                                                   // 339
                    $addToSet: {                                                                                       // 340
                        assetId: assetId                                                                               // 341
                    }                                                                                                  // 340
                }, function (err, cb) {                                                                                // 339
                    if (err) {                                                                                         // 344
                        errors.push(err);                                                                              // 345
                    }                                                                                                  // 346
                });                                                                                                    // 347
            });                                                                                                        // 348
                                                                                                                       //
            if (errors.length) {                                                                                       // 349
                myFuture.throw(errors[0]);                                                                             // 350
            }                                                                                                          // 351
                                                                                                                       //
            myFuture.return({                                                                                          // 352
                message: "Trustee's digital asset added"                                                               // 352
            });                                                                                                        // 352
            return myFuture.wait();                                                                                    // 353
        },                                                                                                             // 354
        getTrusteesByClientId: function (clientId, query) {                                                            // 355
            var filterObject = {                                                                                       // 356
                sort: {                                                                                                // 357
                    createdAt: -1                                                                                      // 357
                }                                                                                                      // 357
            };                                                                                                         // 356
                                                                                                                       //
            if (query) {                                                                                               // 359
                filterObject.skip = query.skip;                                                                        // 360
                filterObject.limit = query.limit;                                                                      // 361
            }                                                                                                          // 362
                                                                                                                       //
            var trustees = Meteor.users.find({                                                                         // 363
                $or: [{                                                                                                // 363
                    clientId: clientId                                                                                 // 363
                }, {                                                                                                   // 363
                    'services.tokenClients.clientId': clientId                                                         // 363
                }]                                                                                                     // 363
            }, filterObject).fetch();                                                                                  // 363
            var countOfAllItems = Meteor.users.find({                                                                  // 364
                $or: [{                                                                                                // 364
                    clientId: clientId                                                                                 // 364
                }, {                                                                                                   // 364
                    'services.tokenClients.clientId': clientId                                                         // 364
                }]                                                                                                     // 364
            }).fetch().length;                                                                                         // 364
            trustees.forEach(function (trustee) {                                                                      // 365
                "use strict";                                                                                          // 366
                                                                                                                       //
                delete trustee.services;                                                                               // 367
            });                                                                                                        // 368
            return {                                                                                                   // 369
                trustees: trustees,                                                                                    // 369
                countOfAllItems: countOfAllItems                                                                       // 369
            };                                                                                                         // 369
        },                                                                                                             // 370
        removeTrustee: function (id) {                                                                                 // 371
            var myFuture = new Future();                                                                               // 372
            Meteor.users.update({                                                                                      // 373
                _id: id                                                                                                // 373
            }, {                                                                                                       // 373
                $set: {                                                                                                // 373
                    status: STATUS.numeric.TRUSTEE_ACCOUNT_DELETED                                                     // 373
                }                                                                                                      // 373
            }, function (err, cb) {                                                                                    // 373
                if (err) {                                                                                             // 374
                    myFuture.throw(err);                                                                               // 375
                }                                                                                                      // 376
                                                                                                                       //
                myFuture.return({                                                                                      // 377
                    message: 'Account removed'                                                                         // 377
                });                                                                                                    // 377
            });                                                                                                        // 378
            return myFuture.wait();                                                                                    // 379
        },                                                                                                             // 380
        createAsset: function (asset, client) {                                                                        // 381
            var myFuture = new Future();                                                                               // 382
            asset.name = encrypt(asset.name);                                                                          // 383
            asset.login = encrypt(asset.login);                                                                        // 384
            asset.password = encrypt(asset.password);                                                                  // 385
            asset.website = encrypt(asset.website); // todo Are they unique?                                           // 386
            // let assetsWithSameName = Assets.find({name: asset.name}).fetch();                                       // 389
            // if (assetsWithSameName.length === 0) {                                                                  // 390
                                                                                                                       //
            Assets.insert(asset, function (err, cb) {                                                                  // 391
                if (err) {                                                                                             // 392
                    myFuture.throw(err);                                                                               // 393
                }                                                                                                      // 394
                                                                                                                       //
                var assetId = cb;                                                                                      // 395
                var clientsAssets = Assets.find({                                                                      // 396
                    clientId: asset.clientId                                                                           // 396
                }).fetch();                                                                                            // 396
                                                                                                                       //
                if (clientsAssets.length < 2) {                                                                        // 397
                    Meteor.users.update({                                                                              // 399
                        _id: client._id                                                                                // 399
                    }, {                                                                                               // 399
                        $set: {                                                                                        // 399
                            status: STATUS.numeric.CLIENT_ACTIVE                                                       // 399
                        }                                                                                              // 399
                    }, function (err, cb) {                                                                            // 399
                        if (err) {                                                                                     // 400
                            myFuture.throw(err);                                                                       // 401
                        }                                                                                              // 402
                                                                                                                       //
                        Email.send({                                                                                   // 403
                            from: 'jeff@trustedheir.com',                                                              // 404
                            to: client.profile.email,                                                                  // 405
                            headers: {                                                                                 // 406
                                'X-SMTPAPI': {                                                                         // 407
                                    'filters': {                                                                       // 408
                                        'templates': {                                                                 // 409
                                            'settings': {                                                              // 410
                                                'enable': 1,                                                           // 411
                                                'template_id': TEMPLATES.CLIENT_FIRST_DIGITAL_ASSET_ADDED              // 412
                                            }                                                                          // 410
                                        }                                                                              // 409
                                    },                                                                                 // 408
                                    'sub': {                                                                           // 416
                                        '%ClientFirstName%': [client.profile.firstName]                                // 417
                                    }                                                                                  // 416
                                }                                                                                      // 407
                            }                                                                                          // 406
                        });                                                                                            // 403
                        myFuture.return({                                                                              // 422
                            message: 'New Asset created. You are Active Client',                                       // 422
                            assetId: assetId                                                                           // 422
                        });                                                                                            // 422
                    });                                                                                                // 423
                } else myFuture.return({                                                                               // 424
                    message: 'New Asset created',                                                                      // 424
                    assetId: assetId                                                                                   // 424
                });                                                                                                    // 424
            }); // } else {                                                                                            // 425
            //     myFuture.throw(new Meteor.Error('An asset with this name already exists'));                         // 427
            // }                                                                                                       // 428
                                                                                                                       //
            return myFuture.wait();                                                                                    // 429
        },                                                                                                             // 430
        addTrusteesToAsset: function (trustees, id) {                                                                  // 431
            "use strict";                                                                                              // 432
                                                                                                                       //
            var myFuture = new Future();                                                                               // 433
            Assets.update({                                                                                            // 434
                _id: id                                                                                                // 434
            }, {                                                                                                       // 434
                $addToSet: {                                                                                           // 435
                    trusteeId: {                                                                                       // 436
                        $each: trustees                                                                                // 437
                    }                                                                                                  // 436
                }                                                                                                      // 435
            }, function (err, cb) {                                                                                    // 434
                if (err) {                                                                                             // 441
                    myFuture.throw(err);                                                                               // 442
                }                                                                                                      // 443
                                                                                                                       //
                myFuture.return({                                                                                      // 444
                    ok: 1                                                                                              // 444
                });                                                                                                    // 444
            }); // todo uncomment after new trustee post-passing instructions                                          // 445
            // let asset = Assets.findOne({_id: id});                                                                  // 448
            // if (asset) {                                                                                            // 449
            //     let trusteeId = asset.trusteeId;                                                                    // 450
            //     if (!trusteeId) {                                                                                   // 451
            //         trusteeId = [];                                                                                 // 452
            //     }                                                                                                   // 453
            //     trusteeId.push(trustees);                                                                           // 454
            //     Assets.update({_id: id}, {                                                                          // 455
            //         $set: {                                                                                         // 456
            //             trusteeId: trusteeId                                                                        // 457
            //         }                                                                                               // 458
            //     }, (err, cb) => {                                                                                   // 459
            //         if (err) {                                                                                      // 460
            //             myFuture.throw(err);                                                                        // 461
            //         }                                                                                               // 462
            //         myFuture.return({ok: 1});                                                                       // 463
            //     });                                                                                                 // 464
            // }                                                                                                       // 465
                                                                                                                       //
            return myFuture.wait();                                                                                    // 466
        }                                                                                                              // 467
    });                                                                                                                // 26
}                                                                                                                      // 484
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"common.js":["babel-runtime/helpers/typeof","meteor/meteor","fibers/future","../collections","../constants","crypto","moment","stripe",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/common.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Future = void 0;                                                                                                   // 1
module.import('fibers/future', {                                                                                       // 1
    "default": function (v) {                                                                                          // 1
        Future = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Assets = void 0,                                                                                                   // 1
    StripeSubscriptions = void 0;                                                                                      // 1
module.import('../collections', {                                                                                      // 1
    "Assets": function (v) {                                                                                           // 1
        Assets = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "StripeSubscriptions": function (v) {                                                                              // 1
        StripeSubscriptions = v;                                                                                       // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var ROLE = void 0,                                                                                                     // 1
    STATUS = void 0,                                                                                                   // 1
    TEMPLATES = void 0,                                                                                                // 1
    SECRET_KEY = void 0,                                                                                               // 1
    TEST_STRIPE_KEY = void 0,                                                                                          // 1
    INTERCOM_APP_ID = void 0;                                                                                          // 1
module.import('../constants', {                                                                                        // 1
    "ROLE": function (v) {                                                                                             // 1
        ROLE = v;                                                                                                      // 1
    },                                                                                                                 // 1
    "STATUS": function (v) {                                                                                           // 1
        STATUS = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "TEMPLATES": function (v) {                                                                                        // 1
        TEMPLATES = v;                                                                                                 // 1
    },                                                                                                                 // 1
    "SECRET_KEY": function (v) {                                                                                       // 1
        SECRET_KEY = v;                                                                                                // 1
    },                                                                                                                 // 1
    "TEST_STRIPE_KEY": function (v) {                                                                                  // 1
        TEST_STRIPE_KEY = v;                                                                                           // 1
    },                                                                                                                 // 1
    "INTERCOM_APP_ID": function (v) {                                                                                  // 1
        INTERCOM_APP_ID = v;                                                                                           // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var crypto = void 0;                                                                                                   // 1
module.import('crypto', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        crypto = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.import('moment', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var stripe = void 0;                                                                                                   // 1
module.import('stripe', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        stripe = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var stripe_test = stripe(TEST_STRIPE_KEY);                                                                             // 8
                                                                                                                       //
function encrypt(data) {                                                                                               // 10
    var cipher = crypto.createCipher('aes192', SECRET_KEY);                                                            // 11
    var crypted = cipher.update(data, 'utf8', 'hex');                                                                  // 12
    crypted += cipher.final('hex');                                                                                    // 13
    return crypted;                                                                                                    // 14
}                                                                                                                      // 15
                                                                                                                       //
function decrypt(data) {                                                                                               // 17
    var decipher = crypto.createDecipher('aes192', SECRET_KEY);                                                        // 18
    var decrypted = decipher.update(data, 'hex', 'utf8');                                                              // 19
    decrypted += decipher.final('utf8');                                                                               // 20
    return decrypted;                                                                                                  // 21
}                                                                                                                      // 22
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 24
    Meteor.methods({                                                                                                   // 25
        //-----------------------------------common methods-------------------------------------------------           // 27
        setRecentActivity: function (id) {                                                                             // 29
            "use strict";                                                                                              // 30
                                                                                                                       //
            Meteor.users.update({                                                                                      // 31
                _id: id                                                                                                // 31
            }, {                                                                                                       // 31
                $set: {                                                                                                // 31
                    recentActivity: {                                                                                  // 31
                        createdAt: new Date()                                                                          // 31
                    }                                                                                                  // 31
                }                                                                                                      // 31
            });                                                                                                        // 31
        },                                                                                                             // 32
        resetUserPassword: function (email) {                                                                          // 33
            var user = Accounts.findUserByEmail(email);                                                                // 34
            var myFuture = new Future();                                                                               // 35
            var tokenRecord = {                                                                                        // 36
                token: Random.secret(),                                                                                // 37
                email: email,                                                                                          // 38
                when: new Date(),                                                                                      // 39
                reason: 'reset'                                                                                        // 40
            };                                                                                                         // 36
            var enrollAccountUrl = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'reset-account');
            Meteor.users.update({                                                                                      // 43
                _id: user._id                                                                                          // 43
            }, {                                                                                                       // 43
                $set: {                                                                                                // 44
                    'services.password.reset': tokenRecord                                                             // 45
                }                                                                                                      // 44
            }, function (err, cb) {                                                                                    // 43
                if (err) {                                                                                             // 48
                    myFuture.throw(err);                                                                               // 49
                }                                                                                                      // 50
                                                                                                                       //
                if (user.roles[0] === ROLE.ADMIN) {                                                                    // 51
                    Email.send({                                                                                       // 52
                        from: 'jeff@trustedheir.com',                                                                  // 53
                        to: email,                                                                                     // 54
                        headers: {                                                                                     // 55
                            'X-SMTPAPI': {                                                                             // 56
                                'filters': {                                                                           // 57
                                    'templates': {                                                                     // 58
                                        'settings': {                                                                  // 59
                                            'enable': 1,                                                               // 60
                                            'template_id': TEMPLATES.ADMIN_RESET_PASSWORD                              // 61
                                        }                                                                              // 59
                                    }                                                                                  // 58
                                },                                                                                     // 57
                                'sub': {                                                                               // 65
                                    '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>']               // 66
                                }                                                                                      // 65
                            }                                                                                          // 56
                        }                                                                                              // 55
                    });                                                                                                // 52
                    myFuture.return({                                                                                  // 71
                        message: 'You successfully reset you password. Please, visit your email'                       // 71
                    });                                                                                                // 71
                } else if (user.roles[0] === ROLE.ESTATE_PLANNER) {                                                    // 72
                    Email.send({                                                                                       // 73
                        from: 'jeff@trustedheir.com',                                                                  // 74
                        to: email,                                                                                     // 75
                        headers: {                                                                                     // 76
                            'X-SMTPAPI': {                                                                             // 77
                                'filters': {                                                                           // 78
                                    'templates': {                                                                     // 79
                                        'settings': {                                                                  // 80
                                            'enable': 1,                                                               // 81
                                            'template_id': TEMPLATES.ESTATE_PLANNER_PASSWORD_RESET                     // 82
                                        }                                                                              // 80
                                    }                                                                                  // 79
                                },                                                                                     // 78
                                'sub': {                                                                               // 86
                                    '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>']               // 87
                                }                                                                                      // 86
                            }                                                                                          // 77
                        }                                                                                              // 76
                    });                                                                                                // 73
                    myFuture.return({                                                                                  // 92
                        message: 'You successfully reset you password. Please, visit your email'                       // 92
                    });                                                                                                // 92
                } else if (user.roles[0] === ROLE.CLIENT) {                                                            // 93
                    Email.send({                                                                                       // 94
                        from: 'jeff@trustedheir.com',                                                                  // 95
                        to: email,                                                                                     // 96
                        headers: {                                                                                     // 97
                            'X-SMTPAPI': {                                                                             // 98
                                'filters': {                                                                           // 99
                                    'templates': {                                                                     // 100
                                        'settings': {                                                                  // 101
                                            'enable': 1,                                                               // 102
                                            'template_id': TEMPLATES.CLIENT_PASSWORD_RESET                             // 103
                                        }                                                                              // 101
                                    }                                                                                  // 100
                                },                                                                                     // 99
                                'sub': {                                                                               // 107
                                    '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>']               // 108
                                }                                                                                      // 107
                            }                                                                                          // 98
                        }                                                                                              // 97
                    });                                                                                                // 94
                    myFuture.return({                                                                                  // 113
                        message: 'You successfully reset you password. Please, visit your email'                       // 113
                    });                                                                                                // 113
                } else if (user.roles[0] === ROLE.TRUSTEE) {                                                           // 114
                    Email.send({                                                                                       // 115
                        from: 'jeff@trustedheir.com',                                                                  // 116
                        to: email,                                                                                     // 117
                        headers: {                                                                                     // 118
                            'X-SMTPAPI': {                                                                             // 119
                                'filters': {                                                                           // 120
                                    'templates': {                                                                     // 121
                                        'settings': {                                                                  // 122
                                            'enable': 1,                                                               // 123
                                            'template_id': TEMPLATES.TRUSTEE_RESET_PASSWORD                            // 124
                                        }                                                                              // 122
                                    }                                                                                  // 121
                                },                                                                                     // 120
                                'sub': {                                                                               // 128
                                    '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>']               // 129
                                }                                                                                      // 128
                            }                                                                                          // 119
                        }                                                                                              // 118
                    });                                                                                                // 115
                    myFuture.return({                                                                                  // 134
                        message: 'You successfully reset you password. Please, visit your email'                       // 134
                    });                                                                                                // 134
                }                                                                                                      // 135
            });                                                                                                        // 136
            return myFuture.wait();                                                                                    // 137
        },                                                                                                             // 138
        getUserById: function (id) {                                                                                   // 139
            var user = Meteor.users.findOne({                                                                          // 140
                _id: id                                                                                                // 140
            });                                                                                                        // 140
                                                                                                                       //
            if (user) {                                                                                                // 141
                delete user.services;                                                                                  // 142
                user.intercomAppId = INTERCOM_APP_ID;                                                                  // 143
            }                                                                                                          // 144
                                                                                                                       //
            return user;                                                                                               // 145
        },                                                                                                             // 146
        updateUser: function (id, userInfo) {                                                                          // 147
            var myFuture = new Future();                                                                               // 148
            var updatedUserInfo = {                                                                                    // 149
                username: userInfo.username                                                                            // 149
            };                                                                                                         // 149
            var profile = userInfo.profile;                                                                            // 150
            var keys = Object.keys(profile);                                                                           // 151
            var i = Object.keys(profile).length;                                                                       // 152
                                                                                                                       //
            for (; i--;) {                                                                                             // 153
                var _Object$assign;                                                                                    // 153
                                                                                                                       //
                var mongoKey = 'profile.' + keys[i];                                                                   // 154
                Object.assign(updatedUserInfo, (_Object$assign = {}, _Object$assign[mongoKey] = profile[keys[i]], _Object$assign));
            }                                                                                                          // 156
                                                                                                                       //
            Meteor.users.update({                                                                                      // 158
                _id: id                                                                                                // 158
            }, {                                                                                                       // 158
                $set: updatedUserInfo                                                                                  // 158
            }, function (err, cb) {                                                                                    // 158
                if (err) {                                                                                             // 159
                    myFuture.throw(err);                                                                               // 160
                }                                                                                                      // 161
                                                                                                                       //
                var user = Meteor.users.findOne({                                                                      // 162
                    _id: id                                                                                            // 162
                });                                                                                                    // 162
                delete user.services;                                                                                  // 163
                myFuture.return({                                                                                      // 164
                    message: "You've successfully updated account.",                                                   // 164
                    user: user                                                                                         // 164
                });                                                                                                    // 164
            });                                                                                                        // 165
            return myFuture.wait();                                                                                    // 166
        },                                                                                                             // 167
        changeEmail: function (userId, newEmail) {                                                                     // 168
            var myFuture = new Future();                                                                               // 169
            var emails = [{                                                                                            // 170
                address: newEmail,                                                                                     // 171
                verified: false,                                                                                       // 172
                createdAt: new Date(),                                                                                 // 173
                currentEmail: true                                                                                     // 174
            }];                                                                                                        // 170
            Meteor.users.findOne({                                                                                     // 176
                _id: userId                                                                                            // 176
            }).emails.forEach(function (emailObj) {                                                                    // 176
                "use strict";                                                                                          // 177
                                                                                                                       //
                if (emailObj.address === newEmail && !emailObj.verified) {                                             // 178
                    return;                                                                                            // 179
                } else if (emailObj.address === newEmail && emailObj.verified) {                                       // 180
                    emails[0].verified = true;                                                                         // 181
                    return;                                                                                            // 182
                }                                                                                                      // 183
                                                                                                                       //
                delete emailObj.currentEmail;                                                                          // 184
                emails.push(emailObj);                                                                                 // 185
            });                                                                                                        // 186
            Meteor.users.update({                                                                                      // 187
                _id: userId                                                                                            // 187
            }, {                                                                                                       // 187
                $set: {                                                                                                // 188
                    'profile.email': newEmail,                                                                         // 189
                    emails: emails // 'emails.0.address': newEmail,                                                    // 190
                    // 'services.password.reset.email': newEmail                                                       // 192
                                                                                                                       //
                }                                                                                                      // 188
            }, function (err, cb) {                                                                                    // 187
                if (err) {                                                                                             // 195
                    myFuture.throw(err);                                                                               // 196
                }                                                                                                      // 197
                                                                                                                       //
                var stripeSubscription = StripeSubscriptions.findOne({                                                 // 198
                    estatePlannerId: userId                                                                            // 198
                });                                                                                                    // 198
                                                                                                                       //
                if (stripeSubscription) {                                                                              // 199
                    stripeSubscription.customerId = decrypt(stripeSubscription.customerId);                            // 200
                    stripe_test.customers.update(stripeSubscription.customerId, {                                      // 201
                        email: newEmail                                                                                // 201
                    }, Meteor.bindEnvironment(function (err, customer) {                                               // 201
                        "use strict";                                                                                  // 202
                                                                                                                       //
                        if (err) {                                                                                     // 203
                            return myFuture.throw(new Meteor.Error(err));                                              // 204
                        }                                                                                              // 205
                                                                                                                       //
                        myFuture.return({                                                                              // 206
                            message: 'You successfully changed the email address for your TrustedHeir account'         // 206
                        });                                                                                            // 206
                    }));                                                                                               // 207
                } else myFuture.return({                                                                               // 208
                    message: 'You successfully changed the email address for your TrustedHeir account'                 // 208
                });                                                                                                    // 208
            });                                                                                                        // 209
            return myFuture.wait();                                                                                    // 210
        },                                                                                                             // 211
        checkCurrentEmail: function (email) {                                                                          // 212
            "use strict";                                                                                              // 213
                                                                                                                       //
            var result = {                                                                                             // 214
                ok: 0                                                                                                  // 214
            };                                                                                                         // 214
            var user = Accounts.findUserByEmail(email);                                                                // 215
                                                                                                                       //
            if (user) {                                                                                                // 216
                user.emails.forEach(function (emailObj) {                                                              // 217
                    if (emailObj.address === email && emailObj.currentEmail) {                                         // 218
                        result.ok = 1;                                                                                 // 219
                    }                                                                                                  // 220
                });                                                                                                    // 221
            }                                                                                                          // 222
                                                                                                                       //
            return result;                                                                                             // 223
        },                                                                                                             // 224
        deleteUser: function (id) {                                                                                    // 225
            Meteor.users.remove({                                                                                      // 226
                _id: id                                                                                                // 226
            });                                                                                                        // 226
            return {                                                                                                   // 227
                message: 'Account deleted'                                                                             // 227
            };                                                                                                         // 227
        },                                                                                                             // 228
        updateAsset: function (assetId, asset) {                                                                       // 229
            var myFuture = new Future();                                                                               // 230
            asset.name = encrypt(asset.name);                                                                          // 232
            asset.login = encrypt(asset.login);                                                                        // 233
            asset.password ? asset.password = encrypt(asset.password) : null;                                          // 234
            asset.website = encrypt(asset.website);                                                                    // 235
            Assets.update({                                                                                            // 237
                _id: assetId                                                                                           // 237
            }, {                                                                                                       // 237
                $set: asset                                                                                            // 237
            }, function (err, cb) {                                                                                    // 237
                if (err) {                                                                                             // 238
                    myFuture.throw(err);                                                                               // 239
                }                                                                                                      // 240
                                                                                                                       //
                var asset = Assets.findOne({                                                                           // 241
                    _id: assetId                                                                                       // 241
                });                                                                                                    // 241
                var clientId = asset.clientId;                                                                         // 242
                myFuture.return({                                                                                      // 243
                    message: "You've successfully updated a digital asset",                                            // 243
                    clientId: clientId                                                                                 // 243
                });                                                                                                    // 243
            });                                                                                                        // 244
            return myFuture.wait();                                                                                    // 245
        },                                                                                                             // 246
        removeAsset: function (id) {                                                                                   // 247
            var myFuture = new Future();                                                                               // 248
            Assets.update({                                                                                            // 249
                _id: id                                                                                                // 249
            }, {                                                                                                       // 249
                $set: {                                                                                                // 250
                    status: STATUS.numeric.DIGITAL_ASSET_DELETED                                                       // 251
                }                                                                                                      // 250
            }, function (err, cb) {                                                                                    // 249
                if (err) {                                                                                             // 254
                    myFuture.throw(err);                                                                               // 255
                }                                                                                                      // 256
                                                                                                                       //
                myFuture.return({                                                                                      // 257
                    message: 'Digital asset removed'                                                                   // 257
                });                                                                                                    // 257
            });                                                                                                        // 258
            return myFuture.wait();                                                                                    // 259
        },                                                                                                             // 260
        loginByToken: function (token) {                                                                               // 261
            var myFuture = new Future();                                                                               // 262
            var user = Meteor.users.findOne({                                                                          // 263
                'services.trusteeToken': {                                                                             // 263
                    $elemMatch: {                                                                                      // 263
                        token: token                                                                                   // 263
                    }                                                                                                  // 263
                }                                                                                                      // 263
            });                                                                                                        // 263
                                                                                                                       //
            if (user) {                                                                                                // 264
                Meteor.users.update({                                                                                  // 265
                    _id: user._id                                                                                      // 265
                }, {                                                                                                   // 265
                    $pull: {                                                                                           // 265
                        'services.trusteeToken': {                                                                     // 265
                            token: token                                                                               // 265
                        }                                                                                              // 265
                    }                                                                                                  // 265
                }, function (err, cb) {                                                                                // 265
                    if (err) {                                                                                         // 266
                        myFuture.throw(err);                                                                           // 267
                    }                                                                                                  // 268
                                                                                                                       //
                    delete user.services;                                                                              // 269
                    myFuture.return({                                                                                  // 270
                        user: user,                                                                                    // 270
                        ok: 1                                                                                          // 270
                    });                                                                                                // 270
                });                                                                                                    // 271
            } else {                                                                                                   // 272
                myFuture.return({                                                                                      // 273
                    ok: 0                                                                                              // 273
                });                                                                                                    // 273
            }                                                                                                          // 274
                                                                                                                       //
            return myFuture.wait();                                                                                    // 275
        },                                                                                                             // 276
        getUserByToken: function (token) {                                                                             // 277
            var user = Meteor.users.findOne({                                                                          // 278
                'services.password.reset.token': token                                                                 // 278
            });                                                                                                        // 278
                                                                                                                       //
            if (user) {                                                                                                // 279
                delete user.services;                                                                                  // 280
            }                                                                                                          // 281
                                                                                                                       //
            return user;                                                                                               // 282
        },                                                                                                             // 283
        getEstatePlannerByToken: function (token) {                                                                    // 284
            var myFuture = new Future();                                                                               // 285
            var estatePlanner = Meteor.users.findOne({                                                                 // 286
                'services.password.reset.token': token                                                                 // 286
            });                                                                                                        // 286
                                                                                                                       //
            if (estatePlanner) {                                                                                       // 287
                Meteor.users.update({                                                                                  // 288
                    _id: estatePlanner._id                                                                             // 288
                }, {                                                                                                   // 288
                    $set: {                                                                                            // 288
                        status: STATUS.numeric.ESTATE_PLANNER_VISITED                                                  // 288
                    }                                                                                                  // 288
                }, function (err, cb) {                                                                                // 288
                    if (err) {                                                                                         // 289
                        myFuture.throw(err);                                                                           // 290
                    }                                                                                                  // 291
                                                                                                                       //
                    delete estatePlanner.services;                                                                     // 292
                                                                                                                       //
                    if (estatePlanner.tempPassword) {                                                                  // 293
                        myFuture.return({                                                                              // 294
                            message: 'Account visited',                                                                // 295
                            estatePlanner: Object.assign(estatePlanner, {                                              // 296
                                status: STATUS.numeric.ESTATE_PLANNER_VISITED                                          // 296
                            }),                                                                                        // 296
                            ok: 1                                                                                      // 297
                        });                                                                                            // 294
                    } else {                                                                                           // 299
                        myFuture.return({                                                                              // 300
                            message: 'Account visited',                                                                // 301
                            estatePlanner: Object.assign(estatePlanner, {                                              // 302
                                status: STATUS.numeric.ESTATE_PLANNER_VISITED                                          // 302
                            }),                                                                                        // 302
                            ok: 2                                                                                      // 303
                        });                                                                                            // 300
                    }                                                                                                  // 305
                });                                                                                                    // 306
            } else myFuture.return({                                                                                   // 307
                ok: 0                                                                                                  // 307
            });                                                                                                        // 307
                                                                                                                       //
            return myFuture.wait();                                                                                    // 308
        },                                                                                                             // 309
        getClientByToken: function (token) {                                                                           // 310
            var myFuture = new Future();                                                                               // 311
            var client = Meteor.users.findOne({                                                                        // 312
                'services.password.reset.token': token                                                                 // 312
            });                                                                                                        // 312
                                                                                                                       //
            if (client) {                                                                                              // 313
                if (client.status === STATUS.numeric.CLIENT_ACCOUNT_DELETED) {                                         // 314
                    myFuture.return({                                                                                  // 315
                        message: 'Your account was deleted',                                                           // 315
                        client: client                                                                                 // 315
                    });                                                                                                // 315
                } else {                                                                                               // 316
                    Meteor.users.update({                                                                              // 317
                        _id: client._id                                                                                // 317
                    }, {                                                                                               // 317
                        $set: {                                                                                        // 317
                            status: STATUS.numeric.CLIENT_VISITED                                                      // 317
                        }                                                                                              // 317
                    }, function (err, cb) {                                                                            // 317
                        if (err) {                                                                                     // 318
                            myFuture.throw(err);                                                                       // 319
                        }                                                                                              // 320
                                                                                                                       //
                        client = Meteor.users.findOne({                                                                // 321
                            'services.password.reset.token': token                                                     // 321
                        });                                                                                            // 321
                        delete client.services;                                                                        // 322
                        myFuture.return({                                                                              // 323
                            message: 'Account visited',                                                                // 323
                            client: client                                                                             // 323
                        });                                                                                            // 323
                    });                                                                                                // 324
                }                                                                                                      // 325
            } else myFuture.return(client);                                                                            // 326
                                                                                                                       //
            return myFuture.wait();                                                                                    // 327
        },                                                                                                             // 328
        getTrusteeByToken: function (token, clientId) {                                                                // 329
            var myFuture = new Future();                                                                               // 330
            var trustee = Meteor.users.findOne({                                                                       // 331
                'services.tokenClients': {                                                                             // 331
                    $elemMatch: {                                                                                      // 331
                        token: token                                                                                   // 331
                    }                                                                                                  // 331
                }                                                                                                      // 331
            });                                                                                                        // 331
                                                                                                                       //
            if (trustee && !trustee.services.password.reset) {                                                         // 332
                var client = Meteor.users.findOne({                                                                    // 333
                    _id: clientId                                                                                      // 333
                });                                                                                                    // 333
                delete client.services;                                                                                // 334
                delete trustee.services;                                                                               // 335
                trustee.reason = 'acceptReject';                                                                       // 336
                myFuture.return({                                                                                      // 337
                    message: 'Account visited',                                                                        // 337
                    trustee: trustee,                                                                                  // 337
                    client: client                                                                                     // 337
                });                                                                                                    // 337
            } else if (trustee && trustee.services.password.reset) {                                                   // 338
                Meteor.users.update({                                                                                  // 339
                    _id: trustee._id                                                                                   // 339
                }, {                                                                                                   // 339
                    $set: {                                                                                            // 339
                        status: STATUS.numeric.TRUSTEE_VISITED                                                         // 339
                    }                                                                                                  // 339
                }, function (err, cb) {                                                                                // 339
                    if (err) {                                                                                         // 340
                        myFuture.throw(err);                                                                           // 341
                    }                                                                                                  // 342
                                                                                                                       //
                    var client = Meteor.users.findOne({                                                                // 343
                        _id: clientId                                                                                  // 343
                    });                                                                                                // 343
                    delete client.services;                                                                            // 344
                    delete trustee.services;                                                                           // 345
                    myFuture.return({                                                                                  // 346
                        message: 'Account visited',                                                                    // 346
                        trustee: trustee,                                                                              // 346
                        client: client                                                                                 // 346
                    });                                                                                                // 346
                });                                                                                                    // 347
            } else myFuture.return(trustee);                                                                           // 348
                                                                                                                       //
            return myFuture.wait();                                                                                    // 349
        },                                                                                                             // 350
        getAssetsByClientId: function (clientId, role, query) {                                                        // 351
            var queryObj = void 0;                                                                                     // 352
                                                                                                                       //
            if (role === ROLE.ADMIN) {                                                                                 // 353
                queryObj = {                                                                                           // 354
                    clientId: clientId                                                                                 // 354
                };                                                                                                     // 354
            } else {                                                                                                   // 355
                queryObj = {                                                                                           // 356
                    clientId: clientId,                                                                                // 356
                    status: {                                                                                          // 356
                        $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                      // 356
                    }                                                                                                  // 356
                };                                                                                                     // 356
            }                                                                                                          // 357
                                                                                                                       //
            var finalAssets = [];                                                                                      // 358
            var client = Meteor.users.findOne({                                                                        // 359
                _id: clientId                                                                                          // 359
            });                                                                                                        // 359
            delete client.services;                                                                                    // 360
            var filterObject = {                                                                                       // 361
                sort: {                                                                                                // 362
                    createdAt: -1                                                                                      // 362
                }                                                                                                      // 362
            };                                                                                                         // 361
                                                                                                                       //
            if (query) {                                                                                               // 364
                filterObject.skip = query.skip;                                                                        // 365
                filterObject.limit = query.limit;                                                                      // 366
            }                                                                                                          // 367
                                                                                                                       //
            var assets = Assets.find(queryObj, filterObject).fetch();                                                  // 368
            var countOfAllItems = Assets.find(queryObj).fetch().length;                                                // 369
            assets.forEach(function (asset) {                                                                          // 370
                asset.name = decrypt(asset.name);                                                                      // 372
                asset.login = decrypt(asset.login);                                                                    // 373
                asset.password = decrypt(asset.password);                                                              // 374
                asset.password = asset.password.replace(/./g, '*');                                                    // 375
                asset.website = decrypt(asset.website); // todo                                                        // 376
                                                                                                                       //
                asset.clientStatus = client.status;                                                                    // 379
                var trustees = [];                                                                                     // 381
                                                                                                                       //
                if (asset.trusteeId) {                                                                                 // 382
                    asset.trusteeId.forEach(function (id) {                                                            // 383
                        "use strict";                                                                                  // 384
                                                                                                                       //
                        var trustee = Meteor.users.findOne({                                                           // 385
                            _id: id                                                                                    // 385
                        });                                                                                            // 385
                                                                                                                       //
                        if (trustee) {                                                                                 // 386
                            delete trustee.services;                                                                   // 387
                            trustees.push(trustee);                                                                    // 388
                        }                                                                                              // 389
                    });                                                                                                // 390
                }                                                                                                      // 391
                                                                                                                       //
                finalAssets.push(Object.assign(asset, {                                                                // 392
                    trustees: trustees                                                                                 // 392
                }));                                                                                                   // 392
            });                                                                                                        // 393
            return {                                                                                                   // 394
                finalAssets: finalAssets,                                                                              // 394
                countOfAllItems: countOfAllItems                                                                       // 394
            };                                                                                                         // 394
        },                                                                                                             // 395
        getAssetById: function (assetId) {                                                                             // 396
            var asset = Assets.findOne({                                                                               // 397
                '_id': assetId                                                                                         // 397
            });                                                                                                        // 397
                                                                                                                       //
            if (asset) {                                                                                               // 398
                var _ret = function () {                                                                               // 398
                    asset.name = decrypt(asset.name);                                                                  // 400
                    asset.login = decrypt(asset.login);                                                                // 401
                    asset.password = decrypt(asset.password);                                                          // 402
                    asset.website = decrypt(asset.website);                                                            // 403
                    var client = Meteor.users.findOne({                                                                // 405
                        _id: asset.clientId                                                                            // 405
                    });                                                                                                // 405
                    delete client.services;                                                                            // 406
                    var trustees = [];                                                                                 // 407
                                                                                                                       //
                    if (asset.trusteeId) {                                                                             // 408
                        asset.trusteeId.forEach(function (id) {                                                        // 409
                            "use strict";                                                                              // 410
                                                                                                                       //
                            var trustee = Meteor.users.findOne({                                                       // 411
                                _id: id                                                                                // 411
                            });                                                                                        // 411
                            delete trustee.services;                                                                   // 412
                            trustees.push(trustee);                                                                    // 413
                        });                                                                                            // 414
                    }                                                                                                  // 415
                                                                                                                       //
                    return {                                                                                           // 416
                        v: Object.assign(asset, {                                                                      // 416
                            trustees: trustees,                                                                        // 416
                            client: client                                                                             // 416
                        })                                                                                             // 416
                    };                                                                                                 // 416
                }();                                                                                                   // 398
                                                                                                                       //
                if ((typeof _ret === "undefined" ? "undefined" : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
            }                                                                                                          // 417
        } //-----------------------------------common methods-------------------------------------------------         // 418
                                                                                                                       //
    });                                                                                                                // 25
    var preventDosAttack = {                                                                                           // 424
        userId: function (userId) {                                                                                    // 425
            return true;                                                                                               // 426
        },                                                                                                             // 427
        type: 'method',                                                                                                // 428
        name: 'checkCurrentEmail'                                                                                      // 429
    };                                                                                                                 // 424
    DDPRateLimiter.addRule(preventDosAttack, 1, 1000);                                                                 // 432
}                                                                                                                      // 434
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"estatePlanner.js":["meteor/meteor","fibers/future","../collections","../constants","crypto","moment","stripe","node-schedule","knox",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/estatePlanner.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Future = void 0;                                                                                                   // 1
module.import('fibers/future', {                                                                                       // 1
    "default": function (v) {                                                                                          // 1
        Future = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Assets = void 0,                                                                                                   // 1
    StripeSubscriptions = void 0,                                                                                      // 1
    FutureEvents = void 0;                                                                                             // 1
module.import('../collections', {                                                                                      // 1
    "Assets": function (v) {                                                                                           // 1
        Assets = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "StripeSubscriptions": function (v) {                                                                              // 1
        StripeSubscriptions = v;                                                                                       // 1
    },                                                                                                                 // 1
    "FutureEvents": function (v) {                                                                                     // 1
        FutureEvents = v;                                                                                              // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var ROLE = void 0,                                                                                                     // 1
    STATUS = void 0,                                                                                                   // 1
    TEMPLATES = void 0,                                                                                                // 1
    SECRET_KEY = void 0,                                                                                               // 1
    TEST_STRIPE_KEY = void 0,                                                                                          // 1
    STRIPE_PLAN_ID = void 0,                                                                                           // 1
    AWS_ACCESS_KEY_ID = void 0,                                                                                        // 1
    AWS_SECRET_ACCESS_KEY = void 0;                                                                                    // 1
module.import('../constants', {                                                                                        // 1
    "ROLE": function (v) {                                                                                             // 1
        ROLE = v;                                                                                                      // 1
    },                                                                                                                 // 1
    "STATUS": function (v) {                                                                                           // 1
        STATUS = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "TEMPLATES": function (v) {                                                                                        // 1
        TEMPLATES = v;                                                                                                 // 1
    },                                                                                                                 // 1
    "SECRET_KEY": function (v) {                                                                                       // 1
        SECRET_KEY = v;                                                                                                // 1
    },                                                                                                                 // 1
    "TEST_STRIPE_KEY": function (v) {                                                                                  // 1
        TEST_STRIPE_KEY = v;                                                                                           // 1
    },                                                                                                                 // 1
    "STRIPE_PLAN_ID": function (v) {                                                                                   // 1
        STRIPE_PLAN_ID = v;                                                                                            // 1
    },                                                                                                                 // 1
    "AWS_ACCESS_KEY_ID": function (v) {                                                                                // 1
        AWS_ACCESS_KEY_ID = v;                                                                                         // 1
    },                                                                                                                 // 1
    "AWS_SECRET_ACCESS_KEY": function (v) {                                                                            // 1
        AWS_SECRET_ACCESS_KEY = v;                                                                                     // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var crypto = void 0;                                                                                                   // 1
module.import('crypto', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        crypto = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.import('moment', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var stripe = void 0;                                                                                                   // 1
module.import('stripe', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        stripe = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var stripe_test = stripe(TEST_STRIPE_KEY);                                                                             // 8
                                                                                                                       //
var schedule = require('node-schedule');                                                                               // 9
                                                                                                                       //
var knox = require('knox');                                                                                            // 10
                                                                                                                       //
var s3Client = knox.createClient({                                                                                     // 11
    key: AWS_ACCESS_KEY_ID,                                                                                            // 11
    secret: AWS_SECRET_ACCESS_KEY,                                                                                     // 11
    bucket: 'files'                                                                                                    // 11
});                                                                                                                    // 11
                                                                                                                       //
function encrypt(data) {                                                                                               // 13
    var cipher = crypto.createCipher('aes192', SECRET_KEY);                                                            // 14
    var crypted = cipher.update(data, 'utf8', 'hex');                                                                  // 15
    crypted += cipher.final('hex');                                                                                    // 16
    return crypted;                                                                                                    // 17
}                                                                                                                      // 18
                                                                                                                       //
function decrypt(data) {                                                                                               // 20
    var decipher = crypto.createDecipher('aes192', SECRET_KEY);                                                        // 21
    var decrypted = decipher.update(data, 'hex', 'utf8');                                                              // 22
    decrypted += decipher.final('utf8');                                                                               // 23
    return decrypted;                                                                                                  // 24
}                                                                                                                      // 25
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 27
    Meteor.methods({                                                                                                   // 28
        //-----------------------------------estate planner's methods-------------------------------------------------
        getCustomerCardInfoById: function (estatePlannerId) {                                                          // 32
            var myFuture = new Future();                                                                               // 33
            var subscriptionDB = StripeSubscriptions.findOne({                                                         // 34
                estatePlannerId: estatePlannerId                                                                       // 34
            });                                                                                                        // 34
                                                                                                                       //
            if (subscriptionDB) {                                                                                      // 35
                "use strict";                                                                                          // 36
                                                                                                                       //
                subscriptionDB.customerId = decrypt(subscriptionDB.customerId);                                        // 37
                stripe_test.customers.retrieve(subscriptionDB.customerId, Meteor.bindEnvironment(function (err, customer) {
                    if (err) {                                                                                         // 39
                        return myFuture.throw(new Meteor.Error(err));                                                  // 40
                    }                                                                                                  // 41
                                                                                                                       //
                    myFuture.return(customer);                                                                         // 42
                }));                                                                                                   // 43
            }                                                                                                          // 45
                                                                                                                       //
            return myFuture.wait();                                                                                    // 46
        },                                                                                                             // 47
        updateEstatePlannerCard: function (estatePlannerId, cardInfo) {                                                // 48
            "use strict";                                                                                              // 49
                                                                                                                       //
            var myFuture = new Future();                                                                               // 50
            var subscriptionDB = StripeSubscriptions.findOne({                                                         // 51
                estatePlannerId: estatePlannerId                                                                       // 51
            });                                                                                                        // 51
                                                                                                                       //
            if (subscriptionDB) {                                                                                      // 52
                "use strict";                                                                                          // 53
                                                                                                                       //
                subscriptionDB.customerId = decrypt(subscriptionDB.customerId);                                        // 54
                stripe_test.customers.update(subscriptionDB.customerId, {                                              // 55
                    source: cardInfo                                                                                   // 55
                }, Meteor.bindEnvironment(function (err, customer) {                                                   // 55
                    if (err) {                                                                                         // 56
                        return myFuture.throw(new Meteor.Error(err));                                                  // 57
                    }                                                                                                  // 58
                                                                                                                       //
                    myFuture.return({                                                                                  // 59
                        message: "You've successfully updated card info"                                               // 59
                    });                                                                                                // 59
                }));                                                                                                   // 60
            }                                                                                                          // 62
                                                                                                                       //
            return myFuture.wait();                                                                                    // 63
        },                                                                                                             // 64
        createEstatePlannerNoAuthentication: function (id, estatePlanner) {                                            // 65
            var myFuture = new Future();                                                                               // 66
            var tokenRecord = {                                                                                        // 67
                token: Random.secret(),                                                                                // 68
                email: estatePlanner.email,                                                                            // 69
                when: new Date(),                                                                                      // 70
                reason: 'enroll'                                                                                       // 71
            };                                                                                                         // 67
            Meteor.users.update({                                                                                      // 73
                _id: id                                                                                                // 73
            }, {                                                                                                       // 73
                $set: {                                                                                                // 74
                    'services.password.reset': tokenRecord,                                                            // 75
                    tempPassword: estatePlanner.tempPassword,                                                          // 76
                    'emails.0.createdAt': new Date(),                                                                  // 77
                    'emails.0.currentEmail': true                                                                      // 78
                }                                                                                                      // 74
            }, function (err, cb) {                                                                                    // 73
                if (err) {                                                                                             // 81
                    myFuture.throw(err);                                                                               // 82
                }                                                                                                      // 83
                                                                                                                       //
                Roles.addUsersToRoles(id, [ROLE.ESTATE_PLANNER]);                                                      // 84
                var enrollAccountUrl = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'estate-planner/set-password');
                Email.send({                                                                                           // 86
                    from: 'jeff@trustedheir.com',                                                                      // 87
                    to: estatePlanner.email,                                                                           // 88
                    headers: {                                                                                         // 89
                        'X-SMTPAPI': {                                                                                 // 90
                            'filters': {                                                                               // 91
                                'templates': {                                                                         // 92
                                    'settings': {                                                                      // 93
                                        'enable': 1,                                                                   // 94
                                        'template_id': TEMPLATES.TWO_FACTOR_AUTHENTICATION                             // 95
                                    }                                                                                  // 93
                                }                                                                                      // 92
                            },                                                                                         // 91
                            'sub': {                                                                                   // 99
                                '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],                  // 100
                                '%FirstName%,': [estatePlanner.profile.firstName]                                      // 101
                            }                                                                                          // 99
                        }                                                                                              // 90
                    }                                                                                                  // 89
                });                                                                                                    // 86
                myFuture.return({                                                                                      // 107
                    message: 'You are successfully added as a new Estate Planner. TrustedHeir will email you and will guide you through authentication process.'
                });                                                                                                    // 107
            });                                                                                                        // 108
            return myFuture.wait();                                                                                    // 109
        },                                                                                                             // 110
        createEstatePlannerNoPayment: function (id, estatePlanner) {                                                   // 111
            var myFuture = new Future();                                                                               // 112
            Meteor.users.update({                                                                                      // 113
                _id: id                                                                                                // 113
            }, {                                                                                                       // 113
                $set: {                                                                                                // 113
                    status: STATUS.numeric.ESTATE_PLANNER_NO_PAYMENT_INFO,                                             // 113
                    'emails.0.verified': true                                                                          // 113
                },                                                                                                     // 113
                $unset: {                                                                                              // 113
                    'services.password.reset': 1,                                                                      // 113
                    tempPassword: 1                                                                                    // 113
                }                                                                                                      // 113
            }, function (err, cb) {                                                                                    // 113
                if (err) {                                                                                             // 114
                    myFuture.throw(err);                                                                               // 115
                }                                                                                                      // 116
                                                                                                                       //
                Email.send({                                                                                           // 117
                    from: 'jeff@trustedheir.com',                                                                      // 118
                    to: estatePlanner.profile.email,                                                                   // 119
                    headers: {                                                                                         // 120
                        'X-SMTPAPI': {                                                                                 // 121
                            'filters': {                                                                               // 122
                                'templates': {                                                                         // 123
                                    'settings': {                                                                      // 124
                                        'enable': 1,                                                                   // 125
                                        'template_id': TEMPLATES.ESTATE_PLANNER_WELCOME_EMAIL                          // 126
                                    }                                                                                  // 124
                                }                                                                                      // 123
                            },                                                                                         // 122
                            'sub': {                                                                                   // 130
                                '%FirstName%': [estatePlanner.profile.firstName]                                       // 131
                            }                                                                                          // 130
                        }                                                                                              // 121
                    }                                                                                                  // 120
                });                                                                                                    // 117
                myFuture.return({                                                                                      // 136
                    message: 'Account created'                                                                         // 136
                });                                                                                                    // 136
            });                                                                                                        // 137
            return myFuture.wait();                                                                                    // 138
        },                                                                                                             // 139
        createEstatePlannerPayment: function (id, estatePlanner) {                                                     // 140
            var myFuture = new Future();                                                                               // 141
            stripe_test.customers.create(estatePlanner, Meteor.bindEnvironment(function (err, customer) {              // 142
                if (err) {                                                                                             // 143
                    return myFuture.throw(new Meteor.Error(err));                                                      // 144
                }                                                                                                      // 145
                                                                                                                       //
                var customerId = customer.id; // todo delete after tests                                               // 146
                                                                                                                       //
                var nextDay = moment(new Date().setDate(new Date().getDate() + 1)).unix(); // let nextMonth = moment(new Date().setMonth(new Date().getMonth() + 1, 1)).unix();
                                                                                                                       //
                stripe_test.subscriptions.create({                                                                     // 151
                    customer: customerId,                                                                              // 152
                    plan: STRIPE_PLAN_ID,                                                                              // 153
                    quantity: 0,                                                                                       // 154
                    trial_end: nextDay // trial_end: nextMonth                                                         // 155
                                                                                                                       //
                }, Meteor.bindEnvironment(function (err, subscription) {                                               // 151
                    if (err) {                                                                                         // 158
                        return myFuture.throw(new Meteor.Error(err));                                                  // 159
                    }                                                                                                  // 160
                                                                                                                       //
                    var subscriptionId = subscription.id;                                                              // 161
                    Meteor.users.update({                                                                              // 162
                        _id: id                                                                                        // 162
                    }, {                                                                                               // 162
                        $set: {                                                                                        // 162
                            status: STATUS.numeric.ESTATE_PLANNER_PAYMENT_INFO                                         // 162
                        }                                                                                              // 162
                    }, function (err, cb) {                                                                            // 162
                        if (err) {                                                                                     // 163
                            myFuture.throw(err);                                                                       // 164
                        }                                                                                              // 165
                                                                                                                       //
                        var invoiceInfo = {                                                                            // 166
                            estatePlannerId: id,                                                                       // 167
                            customerId: encrypt(customerId),                                                           // 168
                            subscriptionId: encrypt(subscriptionId),                                                   // 169
                            quantity: 0,                                                                               // 170
                            billingStatus: 'Paid',                                                                     // 171
                            createdAt: new Date()                                                                      // 172
                        };                                                                                             // 166
                        StripeSubscriptions.insert(invoiceInfo, function (err, cb) {                                   // 174
                            if (err) {                                                                                 // 175
                                myFuture.throw(err);                                                                   // 176
                            }                                                                                          // 177
                                                                                                                       //
                            myFuture.return({                                                                          // 178
                                message: 'Account billing info created'                                                // 178
                            });                                                                                        // 178
                        });                                                                                            // 179
                    });                                                                                                // 180
                }));                                                                                                   // 181
            }));                                                                                                       // 183
            return myFuture.wait();                                                                                    // 184
        },                                                                                                             // 185
        createClientInvited: function (id, client, estatePlanner) {                                                    // 186
            var myFuture = new Future();                                                                               // 187
            var tokenRecord = {                                                                                        // 188
                token: Random.secret(),                                                                                // 189
                email: client.email,                                                                                   // 190
                when: new Date(),                                                                                      // 191
                reason: 'enroll'                                                                                       // 192
            };                                                                                                         // 188
            Meteor.users.update({                                                                                      // 194
                _id: id                                                                                                // 194
            }, {                                                                                                       // 194
                $set: {                                                                                                // 195
                    status: STATUS.numeric.CLIENT_INVITED,                                                             // 196
                    estatePlannerId: estatePlanner._id,                                                                // 197
                    'services.password.reset': tokenRecord,                                                            // 198
                    'emails.0.createdAt': new Date(),                                                                  // 199
                    'emails.0.currentEmail': true                                                                      // 200
                }                                                                                                      // 195
            }, function (err, cb) {                                                                                    // 194
                if (err) {                                                                                             // 203
                    myFuture.throw(err);                                                                               // 204
                }                                                                                                      // 205
                                                                                                                       //
                Roles.addUsersToRoles(id, [ROLE.CLIENT]);                                                              // 206
                var enrollAccountUrl = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'client/set-password');
                Email.send({                                                                                           // 208
                    from: 'jeff@trustedheir.com',                                                                      // 209
                    to: client.email,                                                                                  // 210
                    headers: {                                                                                         // 211
                        'X-SMTPAPI': {                                                                                 // 212
                            'filters': {                                                                               // 213
                                'templates': {                                                                         // 214
                                    'settings': {                                                                      // 215
                                        'enable': 1,                                                                   // 216
                                        'template_id': TEMPLATES.CLIENT_INVITE                                         // 217
                                    }                                                                                  // 215
                                }                                                                                      // 214
                            },                                                                                         // 213
                            'sub': {                                                                                   // 221
                                '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],                  // 222
                                '%ClientFirstName%': [client.profile.firstName],                                       // 223
                                '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                            }                                                                                          // 221
                        }                                                                                              // 212
                    }                                                                                                  // 211
                });                                                                                                    // 208
                var subscription = StripeSubscriptions.findOne({                                                       // 230
                    estatePlannerId: estatePlanner._id                                                                 // 230
                });                                                                                                    // 230
                subscription.customerId = decrypt(subscription.customerId);                                            // 231
                subscription.subscriptionId = decrypt(subscription.subscriptionId);                                    // 232
                var quantity = subscription.quantity + 1;                                                              // 233
                StripeSubscriptions.update({                                                                           // 234
                    _id: subscription._id                                                                              // 234
                }, {                                                                                                   // 234
                    $set: {                                                                                            // 234
                        quantity: quantity                                                                             // 234
                    }                                                                                                  // 234
                }, function (err, cb) {                                                                                // 234
                    "use strict";                                                                                      // 235
                                                                                                                       //
                    if (err) {                                                                                         // 236
                        myFuture.throw(err);                                                                           // 237
                    }                                                                                                  // 238
                                                                                                                       //
                    stripe_test.subscriptions.update(subscription.subscriptionId, {                                    // 239
                        quantity: quantity                                                                             // 241
                    }, Meteor.bindEnvironment(function (err, subscription) {                                           // 240
                        if (err) {                                                                                     // 243
                            return myFuture.throw(new Meteor.Error(err));                                              // 244
                        }                                                                                              // 245
                                                                                                                       //
                        var date = new Date(moment(new Date().setDate(new Date().getDate() + 3)).format('YYYY, M, D'));
                        var futureEvent3 = {                                                                           // 247
                            name: "Client 3-day Follow-up " + id,                                                      // 248
                            type: 'Client 3-day Follow-up',                                                            // 249
                            createdAt: new Date(),                                                                     // 250
                            date: date,                                                                                // 251
                            userId: id                                                                                 // 252
                        };                                                                                             // 247
                        FutureEvents.insert(futureEvent3);                                                             // 254
                        var job3 = schedule.scheduleJob(futureEvent3.name, futureEvent3.date, Meteor.bindEnvironment(function () {
                            var myFuture = new Future();                                                               // 256
                            var client = Meteor.users.findOne({                                                        // 257
                                _id: id                                                                                // 257
                            });                                                                                        // 257
                            FutureEvents.remove({                                                                      // 258
                                name: "Client 3-day Follow-up " + id                                                   // 258
                            });                                                                                        // 258
                                                                                                                       //
                            if (client.status === STATUS.numeric.CLIENT_INVITED) {                                     // 259
                                Email.send({                                                                           // 260
                                    from: 'jeff@trustedheir.com',                                                      // 261
                                    to: client.profile.email,                                                          // 262
                                    headers: {                                                                         // 263
                                        'X-SMTPAPI': {                                                                 // 264
                                            'filters': {                                                               // 265
                                                'templates': {                                                         // 266
                                                    'settings': {                                                      // 267
                                                        'enable': 1,                                                   // 268
                                                        'template_id': TEMPLATES.CLIENT_INVITE_THREE_DAY_FOLLOW_UP     // 269
                                                    }                                                                  // 267
                                                }                                                                      // 266
                                            },                                                                         // 265
                                            'sub': {                                                                   // 273
                                                '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],  // 274
                                                '%ClientFirstName%': [client.profile.firstName],                       // 275
                                                '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                                            }                                                                          // 273
                                        }                                                                              // 264
                                    }                                                                                  // 263
                                });                                                                                    // 260
                                                                                                                       //
                                var _date = new Date(moment(new Date().setDate(new Date().getDate() + 4)).format('YYYY, M, D'));
                                                                                                                       //
                                var futureEvent7 = {                                                                   // 282
                                    name: "Client 7-day Follow-up " + id,                                              // 283
                                    type: 'Client 7-day Follow-up',                                                    // 284
                                    createdAt: new Date(),                                                             // 285
                                    date: _date,                                                                       // 286
                                    userId: id                                                                         // 287
                                };                                                                                     // 282
                                FutureEvents.insert(futureEvent7);                                                     // 289
                                var job7 = schedule.scheduleJob(futureEvent7.name, futureEvent7.date, Meteor.bindEnvironment(function () {
                                    var myFuture = new Future();                                                       // 291
                                    var client = Meteor.users.findOne({                                                // 292
                                        _id: id                                                                        // 292
                                    });                                                                                // 292
                                    FutureEvents.remove({                                                              // 293
                                        name: "Client 3-day Follow-up " + id                                           // 293
                                    });                                                                                // 293
                                                                                                                       //
                                    if (client.status === STATUS.numeric.CLIENT_INVITED) {                             // 294
                                        Email.send({                                                                   // 295
                                            from: 'jeff@trustedheir.com',                                              // 296
                                            to: client.profile.email,                                                  // 297
                                            headers: {                                                                 // 298
                                                'X-SMTPAPI': {                                                         // 299
                                                    'filters': {                                                       // 300
                                                        'templates': {                                                 // 301
                                                            'settings': {                                              // 302
                                                                'enable': 1,                                           // 303
                                                                'template_id': TEMPLATES.CLIENT_INVITE_SEVEN_DAY_FOLLOW_UP
                                                            }                                                          // 302
                                                        }                                                              // 301
                                                    },                                                                 // 300
                                                    'sub': {                                                           // 308
                                                        '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],
                                                        '%ClientFirstName%': [client.profile.firstName],               // 310
                                                        '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                                                    }                                                                  // 308
                                                }                                                                      // 299
                                            }                                                                          // 298
                                        });                                                                            // 295
                                    }                                                                                  // 317
                                                                                                                       //
                                    return myFuture.wait();                                                            // 318
                                }));                                                                                   // 319
                            }                                                                                          // 320
                                                                                                                       //
                            return myFuture.wait();                                                                    // 321
                        }));                                                                                           // 322
                        var clients = Meteor.users.find({                                                              // 324
                            'estatePlannerId': estatePlanner._id                                                       // 324
                        }).fetch();                                                                                    // 324
                                                                                                                       //
                        if (clients.length < 2) {                                                                      // 325
                            Meteor.users.update({                                                                      // 327
                                _id: estatePlanner._id                                                                 // 327
                            }, {                                                                                       // 327
                                $set: {                                                                                // 327
                                    status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_ACTIVE                               // 327
                                }                                                                                      // 327
                            }, function (err, cb) {                                                                    // 327
                                if (err) {                                                                             // 328
                                    myFuture.throw(err);                                                               // 329
                                }                                                                                      // 330
                                                                                                                       //
                                Email.send({                                                                           // 331
                                    from: 'jeff@trustedheir.com',                                                      // 332
                                    to: estatePlanner.profile.email,                                                   // 333
                                    headers: {                                                                         // 334
                                        'X-SMTPAPI': {                                                                 // 335
                                            'filters': {                                                               // 336
                                                'templates': {                                                         // 337
                                                    'settings': {                                                      // 338
                                                        'enable': 1,                                                   // 339
                                                        'template_id': TEMPLATES.FIRST_CLIENT_ADDED                    // 340
                                                    }                                                                  // 338
                                                }                                                                      // 337
                                            },                                                                         // 336
                                            'sub': {                                                                   // 344
                                                '%FirstName%': [estatePlanner.profile.firstName]                       // 345
                                            }                                                                          // 344
                                        }                                                                              // 335
                                    }                                                                                  // 334
                                });                                                                                    // 331
                                myFuture.return({                                                                      // 350
                                    message: "You've successfully added " + client.profile.firstName + " " + client.profile.lastName + " as a new client. TrustedHeir will email your Client and will guide them through creating their digital estate plan. You are active Estate Planner"
                                });                                                                                    // 350
                            });                                                                                        // 351
                        } else myFuture.return({                                                                       // 352
                            message: "You've successfully added " + client.profile.firstName + " " + client.profile.lastName + " as a new client. TrustedHeir will email your Client and will guide them through creating their digital estate plan."
                        });                                                                                            // 352
                    }));                                                                                               // 353
                });                                                                                                    // 354
            });                                                                                                        // 355
            return myFuture.wait();                                                                                    // 356
        },                                                                                                             // 357
        getClients: function (estatePlannerId) {                                                                       // 358
            var clients = Meteor.users.find({                                                                          // 359
                estatePlannerId: estatePlannerId                                                                       // 359
            }).fetch();                                                                                                // 359
            clients.forEach(function (client) {                                                                        // 360
                "use strict";                                                                                          // 361
                                                                                                                       //
                delete client.services;                                                                                // 362
            });                                                                                                        // 363
            return clients;                                                                                            // 364
        },                                                                                                             // 365
        getClientsForLastYear: function (estatePlannerId) {                                                            // 366
            var allClientsByMonth = [];                                                                                // 367
            var monthDates = [];                                                                                       // 368
                                                                                                                       //
            for (var i = 0; i < 12; i++) {                                                                             // 369
                var month = moment().set({                                                                             // 370
                    'year': new Date().getMonth() - i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(),   // 371
                    'month': new Date().getMonth() - i < 0 ? 12 + (new Date().getMonth() - i) : new Date().getMonth() - i
                }).format('MMMM YYYY');                                                                                // 370
                var endOfMonth = moment().set({                                                                        // 374
                    'year': new Date().getMonth() - i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(),   // 375
                    'month': new Date().getMonth() - i < 0 ? 12 + (new Date().getMonth() - i) : new Date().getMonth() - i
                }).endOf('month').format('MMMM DD, YYYY');                                                             // 374
                monthDates.push({                                                                                      // 378
                    month: month,                                                                                      // 378
                    endOfMonth: endOfMonth                                                                             // 378
                });                                                                                                    // 378
                var clientsByMonth = Meteor.users.find({                                                               // 379
                    estatePlannerId: estatePlannerId,                                                                  // 380
                    $where: "return this.createdAt.getMonth() == " + (new Date().getMonth() - i < 0 ? 12 + (new Date().getMonth() - i) : new Date().getMonth() - i)
                }).fetch();                                                                                            // 379
                clientsByMonth.forEach(function (clientByMonth) {                                                      // 383
                    "use strict";                                                                                      // 384
                                                                                                                       //
                    delete clientByMonth.services;                                                                     // 385
                    clientByMonth.createdAt = moment(clientByMonth.createdAt).format('MMMM DD, YYYY');                 // 386
                });                                                                                                    // 387
                allClientsByMonth.push(clientsByMonth);                                                                // 388
            }                                                                                                          // 389
                                                                                                                       //
            var myFuture = new Future();                                                                               // 391
            var stripeSubscription = StripeSubscriptions.findOne({                                                     // 392
                estatePlannerId: estatePlannerId                                                                       // 392
            });                                                                                                        // 392
                                                                                                                       //
            if (stripeSubscription) {                                                                                  // 393
                stripeSubscription.customerId = decrypt(stripeSubscription.customerId);                                // 394
                stripeSubscription.subscriptionId = decrypt(stripeSubscription.subscriptionId);                        // 395
                stripe_test.invoices.retrieveUpcoming(stripeSubscription.customerId, Meteor.bindEnvironment(function (err, invoices) {
                    if (err) {                                                                                         // 397
                        return myFuture.throw(new Meteor.Error(err));                                                  // 398
                    }                                                                                                  // 399
                                                                                                                       //
                    stripe_test.subscriptions.retrieve(stripeSubscription.subscriptionId, Meteor.bindEnvironment(function (err, subscription) {
                        if (err) {                                                                                     // 401
                            return myFuture.throw(new Meteor.Error(err));                                              // 402
                        }                                                                                              // 403
                                                                                                                       //
                        var stripeInfo = {                                                                             // 404
                            subscriptionQuantity: subscription.quantity,                                               // 405
                            subscriptionStatus: subscription.status,                                                   // 406
                            amount_due: invoices.amount_due,                                                           // 407
                            period_end: invoices.period_end                                                            // 408
                        };                                                                                             // 404
                        myFuture.return({                                                                              // 410
                            monthDates: monthDates,                                                                    // 410
                            clientsByMonth: allClientsByMonth,                                                         // 410
                            stripeInfo: stripeInfo                                                                     // 410
                        });                                                                                            // 410
                    }));                                                                                               // 411
                }));                                                                                                   // 412
            } else myFuture.return({                                                                                   // 413
                monthDates: monthDates,                                                                                // 413
                clientsByMonth: allClientsByMonth                                                                      // 413
            });                                                                                                        // 413
                                                                                                                       //
            return myFuture.wait();                                                                                    // 415
        },                                                                                                             // 416
        getClientsWithAssetsAndTrustees: function (estatePlannerId, query) {                                           // 417
            var clientsWithAssets = [];                                                                                // 418
            var filterObject = {                                                                                       // 419
                sort: {                                                                                                // 420
                    createdAt: -1                                                                                      // 420
                }                                                                                                      // 420
            };                                                                                                         // 419
                                                                                                                       //
            if (query) {                                                                                               // 422
                filterObject.skip = query.skip;                                                                        // 423
                filterObject.limit = query.limit;                                                                      // 424
            }                                                                                                          // 425
                                                                                                                       //
            var clients = Meteor.users.find({                                                                          // 426
                estatePlannerId: estatePlannerId                                                                       // 426
            }, filterObject).fetch();                                                                                  // 426
            var countOfAllItems = Meteor.users.find({                                                                  // 427
                estatePlannerId: estatePlannerId                                                                       // 427
            }).fetch().length;                                                                                         // 427
            clients.forEach(function (client) {                                                                        // 428
                delete client.services;                                                                                // 429
                var assets = Assets.find({                                                                             // 430
                    clientId: client._id                                                                               // 430
                }, {                                                                                                   // 430
                    sort: {                                                                                            // 430
                        createdAt: -1                                                                                  // 430
                    }                                                                                                  // 430
                }).fetch();                                                                                            // 430
                client.recentActivity ? client.recentActivity = moment(client.recentActivity.createdAt).format('ll') : client.recentActivity = moment(client.createdAt).format('ll');
                var trustees = Meteor.users.find({                                                                     // 432
                    clientId: client._id                                                                               // 432
                }).fetch();                                                                                            // 432
                var invitedTrustees = Meteor.users.find({                                                              // 433
                    'services.tokenClients.clientId': client._id                                                       // 433
                }, {                                                                                                   // 433
                    sort: {                                                                                            // 433
                        createdAt: -1                                                                                  // 433
                    }                                                                                                  // 433
                }).fetch();                                                                                            // 433
                trustees.forEach(function (trustee) {                                                                  // 434
                    "use strict";                                                                                      // 435
                                                                                                                       //
                    delete trustee.services;                                                                           // 436
                });                                                                                                    // 437
                invitedTrustees.forEach(function (invitedTrustee) {                                                    // 438
                    "use strict";                                                                                      // 439
                                                                                                                       //
                    delete invitedTrustee.services;                                                                    // 440
                });                                                                                                    // 441
                Object.assign(client, {                                                                                // 442
                    assets: assets,                                                                                    // 442
                    trustees: trustees.concat(invitedTrustees)                                                         // 442
                });                                                                                                    // 442
                clientsWithAssets.push(client);                                                                        // 443
            }); /*let closedClients = clientsWithAssets.filter((client) => {                                           // 444
                    return client.status === 2;                                                                        //
                });                                                                                                    //
                let unclosedClients = clientsWithAssets.filter((client) => {                                           //
                    return client.status !== 2;                                                                        //
                });                                                                                                    //
                clientsWithAssets = unclosedClients.concat(closedClients);*/                                           //
            return {                                                                                                   // 452
                clients: clientsWithAssets,                                                                            // 452
                countOfAllItems: countOfAllItems                                                                       // 452
            };                                                                                                         // 452
        },                                                                                                             // 453
        removeClient: function (client) {                                                                              // 454
            var myFuture = new Future();                                                                               // 455
            var estatePlanner = Meteor.users.findOne({                                                                 // 456
                _id: client.estatePlannerId                                                                            // 456
            });                                                                                                        // 456
            var profile = estatePlanner.profile;                                                                       // 457
            Meteor.users.update({                                                                                      // 458
                _id: client._id                                                                                        // 458
            }, {                                                                                                       // 458
                $set: {                                                                                                // 458
                    status: STATUS.numeric.CLIENT_ACCOUNT_DELETED                                                      // 458
                }                                                                                                      // 458
            }, function (err, cb) {                                                                                    // 458
                if (err) {                                                                                             // 459
                    myFuture.throw(err);                                                                               // 460
                }                                                                                                      // 461
                                                                                                                       //
                if (estatePlanner) {                                                                                   // 462
                    Email.send({                                                                                       // 463
                        from: 'jeff@trustedheir.com',                                                                  // 464
                        to: client.profile.email,                                                                      // 465
                        headers: {                                                                                     // 466
                            'X-SMTPAPI': {                                                                             // 467
                                'filters': {                                                                           // 468
                                    'templates': {                                                                     // 469
                                        'settings': {                                                                  // 470
                                            'enable': 1,                                                               // 471
                                            'template_id': TEMPLATES.CLIENT_ACCOUNT_CLOSED                             // 472
                                        }                                                                              // 470
                                    }                                                                                  // 469
                                },                                                                                     // 468
                                'sub': {                                                                               // 476
                                    '%ClientFirstName%': [client.profile.firstName],                                   // 477
                                    '%EstatePlannerFullName%': [profile.firstName + ' ' + profile.lastName]            // 478
                                }                                                                                      // 476
                            }                                                                                          // 467
                        }                                                                                              // 466
                    });                                                                                                // 463
                }                                                                                                      // 483
                                                                                                                       //
                myFuture.return({                                                                                      // 484
                    message: 'Account removed'                                                                         // 484
                });                                                                                                    // 484
            });                                                                                                        // 485
            return myFuture.wait();                                                                                    // 486
        },                                                                                                             // 487
        reActivateClient: function (client) {                                                                          // 488
            var myFuture = new Future();                                                                               // 489
            Meteor.users.update({                                                                                      // 490
                _id: client._id                                                                                        // 490
            }, {                                                                                                       // 490
                $set: {                                                                                                // 491
                    status: STATUS.numeric.CLIENT_ACTIVE                                                               // 492
                }                                                                                                      // 491
            }, function (err, cb) {                                                                                    // 490
                if (err) {                                                                                             // 494
                    myFuture.throw(err);                                                                               // 495
                }                                                                                                      // 496
                                                                                                                       //
                Email.send({                                                                                           // 497
                    from: 'jeff@trustedheir.com',                                                                      // 498
                    to: client.profile.email,                                                                          // 499
                    headers: {                                                                                         // 500
                        'X-SMTPAPI': {                                                                                 // 501
                            'filters': {                                                                               // 502
                                'templates': {                                                                         // 503
                                    'settings': {                                                                      // 504
                                        'enable': 1,                                                                   // 505
                                        'template_id': TEMPLATES.CLIENT_ACCOUNT_REACTIVATED                            // 506
                                    }                                                                                  // 504
                                }                                                                                      // 503
                            },                                                                                         // 502
                            'sub': {                                                                                   // 510
                                '%ClientFirstName%': [client.profile.firstName]                                        // 511
                            }                                                                                          // 510
                        }                                                                                              // 501
                    }                                                                                                  // 500
                });                                                                                                    // 497
                myFuture.return({                                                                                      // 516
                    message: 'Account re-activated'                                                                    // 516
                });                                                                                                    // 516
            });                                                                                                        // 517
            return myFuture.wait();                                                                                    // 518
        },                                                                                                             // 519
        clientPostPassingInProgress: function (deathInfo, client) {                                                    // 520
            var myFuture = new Future();                                                                               // 521
            Meteor.users.update({                                                                                      // 522
                _id: client._id                                                                                        // 522
            }, {                                                                                                       // 522
                $set: {                                                                                                // 523
                    'profile.dateOfDeath': deathInfo.dateOfDeath,                                                      // 524
                    'profile.deathCertificateNumber': deathInfo.deathCertificateNumber,                                // 525
                    status: STATUS.numeric.POST_PASSING_IN_PROGRESS                                                    // 526
                }                                                                                                      // 523
            }, function (err, cb) {                                                                                    // 522
                if (err) {                                                                                             // 529
                    myFuture.throw(err);                                                                               // 530
                }                                                                                                      // 531
                                                                                                                       //
                myFuture.return({                                                                                      // 532
                    message: "You've successfully initiated the post-passing process for " + client.profile.firstName + " " + client.profile.lastName
                });                                                                                                    // 532
            });                                                                                                        // 533
            return myFuture.wait();                                                                                    // 534
        },                                                                                                             // 535
        assetPostPassingProcess: function (asset) {                                                                    // 536
            var myFuture = new Future();                                                                               // 537
            var client = Meteor.users.findOne({                                                                        // 538
                _id: asset.clientId                                                                                    // 538
            });                                                                                                        // 538
            Assets.update({                                                                                            // 539
                _id: asset._id                                                                                         // 539
            }, {                                                                                                       // 539
                $set: {                                                                                                // 540
                    status: STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS                                       // 541
                }                                                                                                      // 540
            }, function (err, cb) {                                                                                    // 539
                if (err) {                                                                                             // 544
                    myFuture.throw(err);                                                                               // 545
                }                                                                                                      // 546
                                                                                                                       //
                var trustees = Meteor.users.find({                                                                     // 547
                    assetId: asset._id                                                                                 // 547
                }, {                                                                                                   // 547
                    sort: {                                                                                            // 547
                        createdAt: 1                                                                                   // 547
                    }                                                                                                  // 547
                }).fetch();                                                                                            // 547
                var primaryTrustee = trustees[0];                                                                      // 548
                var trusteeToken = {                                                                                   // 549
                    token: Random.secret(),                                                                            // 550
                    when: new Date(),                                                                                  // 551
                    reason: 'post-passing'                                                                             // 552
                };                                                                                                     // 549
                var assetURL = Meteor.absoluteUrl("trustee/digital-asset/" + asset._id + "?trusteeToken=" + trusteeToken.token);
                Meteor.users.update({                                                                                  // 555
                    _id: primaryTrustee._id                                                                            // 555
                }, {                                                                                                   // 555
                    $push: {                                                                                           // 555
                        'services.trusteeToken': trusteeToken                                                          // 555
                    }                                                                                                  // 555
                }, function (err, cb) {                                                                                // 555
                    if (err) {                                                                                         // 556
                        myFuture.throw(err);                                                                           // 557
                    }                                                                                                  // 558
                                                                                                                       //
                    Email.send({                                                                                       // 559
                        from: 'jeff@trustedheir.com',                                                                  // 560
                        to: primaryTrustee.profile.email,                                                              // 561
                        headers: {                                                                                     // 562
                            'X-SMTPAPI': {                                                                             // 563
                                'filters': {                                                                           // 564
                                    'templates': {                                                                     // 565
                                        'settings': {                                                                  // 566
                                            'enable': 1,                                                               // 567
                                            'template_id': TEMPLATES.TRUSTEE_POST_PASSING                              // 568
                                        }                                                                              // 566
                                    }                                                                                  // 565
                                },                                                                                     // 564
                                'sub': {                                                                               // 572
                                    '%TrusteeFirstName%': [primaryTrustee.profile.firstName],                          // 573
                                    '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],    // 574
                                    '%ClientFirstName%': [client.profile.firstName],                                   // 575
                                    '%AssetURL%': ['<a href="' + assetURL + '">Link</a>']                              // 576
                                }                                                                                      // 572
                            }                                                                                          // 563
                        }                                                                                              // 562
                    });                                                                                                // 559
                    trustees.shift();                                                                                  // 581
                    var count = trustees.length;                                                                       // 582
                                                                                                                       //
                    var _loop = function (i) {                                                                         // 555
                        var date = new Date(moment(new Date().setDate(new Date().getDate() + 90 * i)).format('YYYY, M, D'));
                        var futureEvent90 = {                                                                          // 585
                            name: "90-day Completed Asset " + asset._id + " " + trustees[i]._id,                       // 586
                            type: '90-day Completed Asset',                                                            // 587
                            createdAt: new Date(),                                                                     // 588
                            date: date,                                                                                // 589
                            userId: trustees[i]._id                                                                    // 590
                        };                                                                                             // 585
                        FutureEvents.insert(futureEvent90);                                                            // 592
                        var job90 = schedule.scheduleJob(futureEvent90.name, futureEvent90.date, Meteor.bindEnvironment(function () {
                            var myFuture = new Future();                                                               // 594
                            FutureEvents.remove({                                                                      // 595
                                name: "90-day Completed Asset " + asset._id + " " + trustees[i]._id                    // 595
                            });                                                                                        // 595
                            var currentAsset = Assets.findOne({                                                        // 596
                                _id: asset._id                                                                         // 596
                            });                                                                                        // 596
                                                                                                                       //
                            if (!currentAsset || currentAsset && currentAsset.activeTrusteeId) {                       // 597
                                myFuture.return({                                                                      // 598
                                    message: "You've successfully completed the post-passing process for " + asset.name
                                });                                                                                    // 598
                            } else {                                                                                   // 599
                                (function () {                                                                         // 599
                                    var trusteeToken = {                                                               // 600
                                        token: Random.secret(),                                                        // 601
                                        when: new Date(),                                                              // 602
                                        reason: 'post-passing'                                                         // 603
                                    };                                                                                 // 600
                                    var assetURL = Meteor.absoluteUrl("trustee/digital-asset/" + asset._id + "?trusteeToken=" + trusteeToken.token);
                                    Meteor.users.update({                                                              // 606
                                        _id: trustees[i]._id                                                           // 606
                                    }, {                                                                               // 606
                                        $push: {                                                                       // 606
                                            'services.trusteeToken': trusteeToken                                      // 606
                                        }                                                                              // 606
                                    }, function (err, cb) {                                                            // 606
                                        if (err) {                                                                     // 607
                                            myFuture.throw(err);                                                       // 608
                                        }                                                                              // 609
                                                                                                                       //
                                        Email.send({                                                                   // 610
                                            from: 'jeff@trustedheir.com',                                              // 611
                                            to: trustees[i].profile.email,                                             // 612
                                            headers: {                                                                 // 613
                                                'X-SMTPAPI': {                                                         // 614
                                                    'filters': {                                                       // 615
                                                        'templates': {                                                 // 616
                                                            'settings': {                                              // 617
                                                                'enable': 1,                                           // 618
                                                                'template_id': TEMPLATES.TRUSTEE_POST_PASSING          // 619
                                                            }                                                          // 617
                                                        }                                                              // 616
                                                    },                                                                 // 615
                                                    'sub': {                                                           // 623
                                                        '%TrusteeFirstName%': [trustees[i].profile.firstName],         // 624
                                                        '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],
                                                        '%ClientFirstName%': [client.profile.firstName],               // 626
                                                        '%AssetURL%': ['<a href="' + assetURL + '">Link</a>']          // 627
                                                    }                                                                  // 623
                                                }                                                                      // 614
                                            }                                                                          // 613
                                        });                                                                            // 610
                                        myFuture.return({                                                              // 632
                                            message: "You've successfully initiated the post-passing process for " + asset.name
                                        });                                                                            // 632
                                    });                                                                                // 633
                                })();                                                                                  // 599
                            }                                                                                          // 634
                                                                                                                       //
                            return myFuture.wait();                                                                    // 635
                        }));                                                                                           // 636
                    };                                                                                                 // 555
                                                                                                                       //
                    for (var i = 1; i <= count; i++) {                                                                 // 583
                        _loop(i);                                                                                      // 583
                    }                                                                                                  // 637
                                                                                                                       //
                    myFuture.return({                                                                                  // 638
                        message: "You've successfully initiated the post-passing process for " + asset.name            // 638
                    });                                                                                                // 638
                });                                                                                                    // 639
            });                                                                                                        // 640
            return myFuture.wait();                                                                                    // 641
        } //-----------------------------------estate planner's methods-------------------------------------------------
                                                                                                                       //
    });                                                                                                                // 28
}                                                                                                                      // 647
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"trustee.js":["babel-runtime/helpers/typeof","meteor/meteor","fibers/future","../collections","../constants","crypto","moment","stripe",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/methods/trustee.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof2 = require("babel-runtime/helpers/typeof");                                                                //
                                                                                                                       //
var _typeof3 = _interopRequireDefault(_typeof2);                                                                       //
                                                                                                                       //
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }                      //
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var Future = void 0;                                                                                                   // 1
module.import('fibers/future', {                                                                                       // 1
    "default": function (v) {                                                                                          // 1
        Future = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var Assets = void 0;                                                                                                   // 1
module.import('../collections', {                                                                                      // 1
    "Assets": function (v) {                                                                                           // 1
        Assets = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var ROLE = void 0,                                                                                                     // 1
    STATUS = void 0,                                                                                                   // 1
    TEMPLATES = void 0,                                                                                                // 1
    SECRET_KEY = void 0,                                                                                               // 1
    TEST_STRIPE_KEY = void 0,                                                                                          // 1
    ASSET_STATUS_MESSAGE = void 0;                                                                                     // 1
module.import('../constants', {                                                                                        // 1
    "ROLE": function (v) {                                                                                             // 1
        ROLE = v;                                                                                                      // 1
    },                                                                                                                 // 1
    "STATUS": function (v) {                                                                                           // 1
        STATUS = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "TEMPLATES": function (v) {                                                                                        // 1
        TEMPLATES = v;                                                                                                 // 1
    },                                                                                                                 // 1
    "SECRET_KEY": function (v) {                                                                                       // 1
        SECRET_KEY = v;                                                                                                // 1
    },                                                                                                                 // 1
    "TEST_STRIPE_KEY": function (v) {                                                                                  // 1
        TEST_STRIPE_KEY = v;                                                                                           // 1
    },                                                                                                                 // 1
    "ASSET_STATUS_MESSAGE": function (v) {                                                                             // 1
        ASSET_STATUS_MESSAGE = v;                                                                                      // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var crypto = void 0;                                                                                                   // 1
module.import('crypto', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        crypto = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.import('moment', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var stripe = void 0;                                                                                                   // 1
module.import('stripe', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        stripe = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 6);                                                                                                                 // 1
var stripe_test = stripe(TEST_STRIPE_KEY);                                                                             // 8
                                                                                                                       //
function encrypt(data) {                                                                                               // 10
    var cipher = crypto.createCipher('aes192', SECRET_KEY);                                                            // 11
    var crypted = cipher.update(data, 'utf8', 'hex');                                                                  // 12
    crypted += cipher.final('hex');                                                                                    // 13
    return crypted;                                                                                                    // 14
}                                                                                                                      // 15
                                                                                                                       //
function decrypt(data) {                                                                                               // 17
    var decipher = crypto.createDecipher('aes192', SECRET_KEY);                                                        // 18
    var decrypted = decipher.update(data, 'hex', 'utf8');                                                              // 19
    decrypted += decipher.final('utf8');                                                                               // 20
    return decrypted;                                                                                                  // 21
}                                                                                                                      // 22
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 24
    Meteor.methods({                                                                                                   // 25
        //-----------------------------------trustee's methods-------------------------------------------------        // 27
        acceptTrustee: function (trustee, clientId) {                                                                  // 29
            var myFuture = new Future();                                                                               // 30
            var clientsAssetsIds = [];                                                                                 // 31
            var clientsAssets = Assets.find({                                                                          // 32
                clientId: clientId,                                                                                    // 32
                trusteeId: trustee._id                                                                                 // 32
            }).fetch();                                                                                                // 32
            clientsAssets.forEach(function (asset) {                                                                   // 33
                "use strict";                                                                                          // 34
                                                                                                                       //
                clientsAssetsIds.push(asset._id);                                                                      // 35
            });                                                                                                        // 36
            Meteor.users.update({                                                                                      // 37
                _id: trustee._id                                                                                       // 37
            }, {                                                                                                       // 37
                $set: {                                                                                                // 38
                    status: STATUS.numeric.TRUSTEE_ACCEPTED                                                            // 39
                },                                                                                                     // 38
                $addToSet: {                                                                                           // 41
                    clientId: clientId,                                                                                // 42
                    assetId: {                                                                                         // 43
                        $each: clientsAssetsIds                                                                        // 43
                    }                                                                                                  // 43
                },                                                                                                     // 41
                $pull: {                                                                                               // 45
                    'services.tokenClients': {                                                                         // 46
                        clientId: clientId                                                                             // 47
                    }                                                                                                  // 46
                }                                                                                                      // 45
            }, function (err, cb) {                                                                                    // 37
                if (err) {                                                                                             // 50
                    myFuture.throw(err);                                                                               // 51
                }                                                                                                      // 52
                                                                                                                       //
                var client = Meteor.users.findOne({                                                                    // 54
                    _id: clientId                                                                                      // 54
                });                                                                                                    // 54
                Email.send({                                                                                           // 56
                    from: 'jeff@trustedheir.com',                                                                      // 57
                    to: client.profile.email,                                                                          // 58
                    headers: {                                                                                         // 59
                        'X-SMTPAPI': {                                                                                 // 60
                            'filters': {                                                                               // 61
                                'templates': {                                                                         // 62
                                    'settings': {                                                                      // 63
                                        'enable': 1,                                                                   // 64
                                        'template_id': TEMPLATES.TRUSTEE_ACCEPTED                                      // 65
                                    }                                                                                  // 63
                                }                                                                                      // 62
                            },                                                                                         // 61
                            'sub': {                                                                                   // 69
                                '%ClientFirstName%': [client.profile.firstName],                                       // 70
                                '%InvitedTrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName],
                                '%TrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName]      // 72
                            }                                                                                          // 69
                        }                                                                                              // 60
                    }                                                                                                  // 59
                });                                                                                                    // 56
                Email.send({                                                                                           // 78
                    from: 'jeff@trustedheir.com',                                                                      // 79
                    to: trustee.profile.email,                                                                         // 80
                    headers: {                                                                                         // 81
                        'X-SMTPAPI': {                                                                                 // 82
                            'filters': {                                                                               // 83
                                'templates': {                                                                         // 84
                                    'settings': {                                                                      // 85
                                        'enable': 1,                                                                   // 86
                                        'template_id': TEMPLATES.TRUSTEE_WELCOME                                       // 87
                                    }                                                                                  // 85
                                }                                                                                      // 84
                            },                                                                                         // 83
                            'sub': {                                                                                   // 91
                                '%FirstName%': [trustee.profile.firstName],                                            // 92
                                '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName]         // 93
                            }                                                                                          // 91
                        }                                                                                              // 82
                    }                                                                                                  // 81
                });                                                                                                    // 78
                myFuture.return({                                                                                      // 99
                    message: 'Trustee accepted'                                                                        // 99
                });                                                                                                    // 99
            });                                                                                                        // 100
            return myFuture.wait();                                                                                    // 101
        },                                                                                                             // 102
        rejectTrustee: function (trustee, clientId) {                                                                  // 103
            var myFuture = new Future();                                                                               // 104
            var user = Meteor.users.findOne({                                                                          // 105
                _id: trustee._id                                                                                       // 105
            });                                                                                                        // 105
                                                                                                                       //
            if (user && user.services.tokenClients.length > 1 || user && user.emails[0].verified) {                    // 106
                Meteor.users.update({                                                                                  // 107
                    _id: trustee._id                                                                                   // 107
                }, {                                                                                                   // 107
                    $pull: {                                                                                           // 108
                        'services.tokenClients': {                                                                     // 109
                            clientId: clientId                                                                         // 110
                        }                                                                                              // 109
                    }                                                                                                  // 108
                }, function (err, cb) {                                                                                // 107
                    if (err) {                                                                                         // 113
                        myFuture.throw(err);                                                                           // 114
                    }                                                                                                  // 115
                                                                                                                       //
                    var client = Meteor.users.findOne({                                                                // 117
                        _id: clientId                                                                                  // 117
                    });                                                                                                // 117
                    Email.send({                                                                                       // 119
                        from: 'jeff@trustedheir.com',                                                                  // 120
                        to: client.profile.email,                                                                      // 121
                        headers: {                                                                                     // 122
                            'X-SMTPAPI': {                                                                             // 123
                                'filters': {                                                                           // 124
                                    'templates': {                                                                     // 125
                                        'settings': {                                                                  // 126
                                            'enable': 1,                                                               // 127
                                            'template_id': TEMPLATES.TRUSTEE_DECLINED                                  // 128
                                        }                                                                              // 126
                                    }                                                                                  // 125
                                },                                                                                     // 124
                                'sub': {                                                                               // 132
                                    '%ClientFirstName%': [client.profile.firstName],                                   // 133
                                    '%TrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName]  // 134
                                }                                                                                      // 132
                            }                                                                                          // 123
                        }                                                                                              // 122
                    });                                                                                                // 119
                    var errors = [];                                                                                   // 140
                    var clientsAssets = Assets.find({                                                                  // 141
                        clientId: clientId,                                                                            // 141
                        trusteeId: trustee._id                                                                         // 141
                    }).fetch();                                                                                        // 141
                    clientsAssets.forEach(function (asset) {                                                           // 142
                        "use strict";                                                                                  // 143
                                                                                                                       //
                        Assets.update({                                                                                // 144
                            _id: asset._id                                                                             // 144
                        }, {                                                                                           // 144
                            $pull: {                                                                                   // 144
                                trusteeId: trustee._id                                                                 // 144
                            }                                                                                          // 144
                        }, function (err, cb) {                                                                        // 144
                            if (err) {                                                                                 // 145
                                errors.push(err);                                                                      // 146
                            }                                                                                          // 147
                        });                                                                                            // 148
                    });                                                                                                // 149
                                                                                                                       //
                    if (errors.length) {                                                                               // 150
                        myFuture.throw(errors[0]);                                                                     // 151
                    }                                                                                                  // 152
                                                                                                                       //
                    myFuture.return({                                                                                  // 154
                        message: 'Trustee rejected'                                                                    // 154
                    });                                                                                                // 154
                });                                                                                                    // 155
            } else {                                                                                                   // 156
                Meteor.users.update({                                                                                  // 157
                    _id: trustee._id                                                                                   // 157
                }, {                                                                                                   // 157
                    $set: {                                                                                            // 158
                        status: STATUS.numeric.TRUSTEE_DECLINED,                                                       // 159
                        'emails.0.verified': true                                                                      // 160
                    },                                                                                                 // 158
                    $unset: {                                                                                          // 162
                        'services.password.reset': 1                                                                   // 163
                    }                                                                                                  // 162
                }, function (err, cb) {                                                                                // 157
                    if (err) {                                                                                         // 165
                        myFuture.throw(err);                                                                           // 166
                    }                                                                                                  // 167
                                                                                                                       //
                    var client = Meteor.users.findOne({                                                                // 169
                        _id: clientId                                                                                  // 169
                    });                                                                                                // 169
                    Email.send({                                                                                       // 171
                        from: 'jeff@trustedheir.com',                                                                  // 172
                        to: client.profile.email,                                                                      // 173
                        headers: {                                                                                     // 174
                            'X-SMTPAPI': {                                                                             // 175
                                'filters': {                                                                           // 176
                                    'templates': {                                                                     // 177
                                        'settings': {                                                                  // 178
                                            'enable': 1,                                                               // 179
                                            'template_id': TEMPLATES.TRUSTEE_DECLINED                                  // 180
                                        }                                                                              // 178
                                    }                                                                                  // 177
                                },                                                                                     // 176
                                'sub': {                                                                               // 184
                                    '%ClientFirstName%': [client.profile.firstName],                                   // 185
                                    '%TrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName]  // 186
                                }                                                                                      // 184
                            }                                                                                          // 175
                        }                                                                                              // 174
                    });                                                                                                // 171
                    var errors = [];                                                                                   // 192
                    var clientsAssets = Assets.find({                                                                  // 193
                        clientId: clientId,                                                                            // 193
                        trusteeId: trustee._id                                                                         // 193
                    }).fetch();                                                                                        // 193
                    clientsAssets.forEach(function (asset) {                                                           // 194
                        "use strict";                                                                                  // 195
                                                                                                                       //
                        Assets.update({                                                                                // 196
                            _id: asset._id                                                                             // 196
                        }, {                                                                                           // 196
                            $pull: {                                                                                   // 196
                                trusteeId: trustee._id                                                                 // 196
                            }                                                                                          // 196
                        }, function (err, cb) {                                                                        // 196
                            if (err) {                                                                                 // 197
                                errors.push(err);                                                                      // 198
                            }                                                                                          // 199
                        });                                                                                            // 200
                    });                                                                                                // 201
                                                                                                                       //
                    if (errors.length) {                                                                               // 202
                        myFuture.throw(errors[0]);                                                                     // 203
                    }                                                                                                  // 204
                                                                                                                       //
                    myFuture.return({                                                                                  // 206
                        message: 'Trustee rejected'                                                                    // 206
                    });                                                                                                // 206
                });                                                                                                    // 207
            }                                                                                                          // 208
                                                                                                                       //
            return myFuture.wait();                                                                                    // 209
        },                                                                                                             // 210
        createTrusteeActive: function (id) {                                                                           // 211
            var myFuture = new Future();                                                                               // 212
            Meteor.users.update({                                                                                      // 213
                _id: id                                                                                                // 213
            }, {                                                                                                       // 213
                $set: {                                                                                                // 213
                    status: STATUS.numeric.TRUSTEE_ACTIVE                                                              // 213
                }                                                                                                      // 213
            }, function (err, cb) {                                                                                    // 213
                if (err) {                                                                                             // 214
                    myFuture.throw(err);                                                                               // 215
                }                                                                                                      // 216
                                                                                                                       //
                var trustee = Meteor.users.findOne({                                                                   // 217
                    _id: id                                                                                            // 217
                });                                                                                                    // 217
                delete trustee.services;                                                                               // 218
                myFuture.return({                                                                                      // 219
                    message: 'You’ve successfully created your TrustedHeir account',                                   // 219
                    trustee: trustee                                                                                   // 219
                });                                                                                                    // 219
            });                                                                                                        // 220
            return myFuture.wait();                                                                                    // 221
        },                                                                                                             // 222
        changeAssetStatus: function (assetId, status) {                                                                // 223
            var myFuture = new Future();                                                                               // 224
            var message = void 0;                                                                                      // 225
                                                                                                                       //
            for (var key in meteorBabelHelpers.sanitizeForInObject(STATUS.numeric)) {                                  // 226
                if (status === STATUS.numeric[key]) {                                                                  // 227
                    message = ASSET_STATUS_MESSAGE[key];                                                               // 228
                }                                                                                                      // 229
            }                                                                                                          // 230
                                                                                                                       //
            Assets.update({                                                                                            // 231
                _id: assetId                                                                                           // 231
            }, {                                                                                                       // 231
                $set: {                                                                                                // 231
                    status: status                                                                                     // 231
                }                                                                                                      // 231
            }, function (err, cb) {                                                                                    // 231
                if (err) {                                                                                             // 232
                    myFuture.throw(err);                                                                               // 233
                }                                                                                                      // 234
                                                                                                                       //
                myFuture.return({                                                                                      // 235
                    message: message                                                                                   // 235
                });                                                                                                    // 235
            });                                                                                                        // 236
            return myFuture.wait();                                                                                    // 237
        },                                                                                                             // 238
        addAssetToCompleted: function (assetId, trusteeId) {                                                           // 239
            "use strict";                                                                                              // 240
                                                                                                                       //
            var myFuture = new Future();                                                                               // 241
            Assets.update({                                                                                            // 242
                _id: assetId                                                                                           // 242
            }, {                                                                                                       // 242
                $set: {                                                                                                // 242
                    activeTrusteeId: trusteeId                                                                         // 242
                }                                                                                                      // 242
            }, function (err, cb) {                                                                                    // 242
                if (err) {                                                                                             // 243
                    myFuture.throw(err);                                                                               // 244
                }                                                                                                      // 245
                                                                                                                       //
                myFuture.return({                                                                                      // 246
                    ok: 1                                                                                              // 246
                });                                                                                                    // 246
            });                                                                                                        // 247
            return myFuture.wait();                                                                                    // 248
        },                                                                                                             // 249
        getAssetByTrustee: function (assetId) {                                                                        // 250
            var asset = Assets.findOne({                                                                               // 251
                _id: assetId,                                                                                          // 251
                status: {                                                                                              // 251
                    $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                          // 251
                }                                                                                                      // 251
            });                                                                                                        // 251
                                                                                                                       //
            if (asset) {                                                                                               // 252
                var _ret = function () {                                                                               // 252
                    var client = Meteor.users.findOne({                                                                // 253
                        _id: asset.clientId,                                                                           // 253
                        status: {                                                                                      // 253
                            $ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED                                                 // 253
                        }                                                                                              // 253
                    });                                                                                                // 253
                                                                                                                       //
                    if (client) {                                                                                      // 254
                        delete client.services;                                                                        // 255
                    }                                                                                                  // 256
                                                                                                                       //
                    if (client && client.status === STATUS.numeric.POST_PASSING_IN_PROGRESS && (asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS || asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED || asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED || asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED || asset.status === STATUS.numeric.DIGITAL_ASSET_COMPLETED)) {
                        asset.name = decrypt(asset.name);                                                              // 267
                        asset.login = decrypt(asset.login);                                                            // 268
                        asset.password = decrypt(asset.password);                                                      // 269
                        asset.website = decrypt(asset.website);                                                        // 270
                    } else {                                                                                           // 271
                        asset.name = decrypt(asset.name);                                                              // 272
                        asset.login = 'hidden';                                                                        // 273
                        asset.password = 'hidden';                                                                     // 274
                        asset.website = decrypt(asset.website);                                                        // 275
                    }                                                                                                  // 276
                                                                                                                       //
                    var trustees = [];                                                                                 // 277
                                                                                                                       //
                    if (asset.trusteeId) {                                                                             // 278
                        asset.trusteeId.forEach(function (id) {                                                        // 279
                            "use strict";                                                                              // 280
                                                                                                                       //
                            var trustee = Meteor.users.findOne({                                                       // 281
                                _id: id                                                                                // 281
                            });                                                                                        // 281
                            delete trustee.services;                                                                   // 282
                            trustees.push(trustee);                                                                    // 283
                        });                                                                                            // 284
                    }                                                                                                  // 285
                                                                                                                       //
                    return {                                                                                           // 286
                        v: Object.assign(asset, {                                                                      // 286
                            trustees: trustees,                                                                        // 286
                            client: client,                                                                            // 286
                            ok: 1                                                                                      // 286
                        })                                                                                             // 286
                    };                                                                                                 // 286
                }();                                                                                                   // 252
                                                                                                                       //
                if ((typeof _ret === "undefined" ? "undefined" : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
            } else {                                                                                                   // 287
                return {                                                                                               // 288
                    ok: 0,                                                                                             // 288
                    message: 'Asset was canceled'                                                                      // 288
                };                                                                                                     // 288
            }                                                                                                          // 289
        },                                                                                                             // 290
        getClientsOfTrustee: function (trustee, query) {                                                               // 291
            var finalClients = [];                                                                                     // 292
            var filterObject = {                                                                                       // 293
                sort: {                                                                                                // 294
                    createdAt: -1                                                                                      // 294
                }                                                                                                      // 294
            };                                                                                                         // 293
                                                                                                                       //
            if (query) {                                                                                               // 296
                filterObject.skip = query.skip;                                                                        // 297
                filterObject.limit = query.limit;                                                                      // 298
            }                                                                                                          // 299
                                                                                                                       //
            var clientIds = trustee.clientId;                                                                          // 300
            var clients = Meteor.users.find({                                                                          // 301
                _id: {                                                                                                 // 301
                    $in: clientIds                                                                                     // 301
                },                                                                                                     // 301
                status: {                                                                                              // 301
                    $ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED                                                         // 301
                }                                                                                                      // 301
            }, filterObject).fetch();                                                                                  // 301
            var countOfAllItems = Meteor.users.find({                                                                  // 302
                _id: {                                                                                                 // 302
                    $in: clientIds                                                                                     // 302
                },                                                                                                     // 302
                status: {                                                                                              // 302
                    $ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED                                                         // 302
                }                                                                                                      // 302
            }).fetch().length;                                                                                         // 302
            clients.forEach(function (client) {                                                                        // 303
                if (client) {                                                                                          // 304
                    delete client.services;                                                                            // 305
                    finalClients.push(client);                                                                         // 306
                }                                                                                                      // 307
            });                                                                                                        // 308
            return {                                                                                                   // 309
                clients: finalClients,                                                                                 // 309
                countOfAllItems: countOfAllItems                                                                       // 309
            };                                                                                                         // 309
        },                                                                                                             // 310
        getAssetsByTrusteeId: function (trusteeId, query) {                                                            // 311
            var finalAssets = [];                                                                                      // 312
            var filterObject = {                                                                                       // 313
                sort: {                                                                                                // 314
                    createdAt: -1                                                                                      // 314
                }                                                                                                      // 314
            };                                                                                                         // 313
                                                                                                                       //
            if (query) {                                                                                               // 316
                filterObject.skip = query.skip;                                                                        // 317
                filterObject.limit = query.limit;                                                                      // 318
            }                                                                                                          // 319
                                                                                                                       //
            var assetIds = Meteor.users.findOne({                                                                      // 320
                _id: trusteeId                                                                                         // 320
            }).assetId;                                                                                                // 320
                                                                                                                       //
            if (assetIds) {                                                                                            // 322
                var assets = Assets.find({                                                                             // 323
                    _id: {                                                                                             // 323
                        $in: assetIds                                                                                  // 323
                    },                                                                                                 // 323
                    status: {                                                                                          // 323
                        $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                      // 323
                    }                                                                                                  // 323
                }, filterObject);                                                                                      // 323
                var countOfAllItems = Assets.find({                                                                    // 324
                    _id: {                                                                                             // 324
                        $in: assetIds                                                                                  // 324
                    },                                                                                                 // 324
                    status: {                                                                                          // 324
                        $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                      // 324
                    }                                                                                                  // 324
                }).fetch().length;                                                                                     // 324
                assets.forEach(function (asset) {                                                                      // 325
                    if (asset) {                                                                                       // 326
                        var client = Meteor.users.findOne({                                                            // 327
                            _id: asset.clientId,                                                                       // 327
                            status: {                                                                                  // 327
                                $ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED                                             // 327
                            }                                                                                          // 327
                        });                                                                                            // 327
                                                                                                                       //
                        if (client) {                                                                                  // 328
                            if (asset) {                                                                               // 329
                                asset.name = decrypt(asset.name);                                                      // 330
                                asset.login = 'hidden';                                                                // 331
                                asset.password = 'hidden';                                                             // 332
                                asset.website = decrypt(asset.website);                                                // 333
                                finalAssets.push(asset);                                                               // 334
                            }                                                                                          // 335
                        }                                                                                              // 336
                    }                                                                                                  // 337
                });                                                                                                    // 338
                return {                                                                                               // 339
                    finalAssets: finalAssets,                                                                          // 339
                    countOfAllItems: countOfAllItems                                                                   // 339
                };                                                                                                     // 339
            }                                                                                                          // 340
        },                                                                                                             // 341
        getClientAssetsOfTrustee: function (user, clientId, query) {                                                   // 342
            var finalAssets = [];                                                                                      // 343
            var filterObject = {                                                                                       // 344
                sort: {                                                                                                // 345
                    createdAt: -1                                                                                      // 345
                }                                                                                                      // 345
            };                                                                                                         // 344
                                                                                                                       //
            if (query) {                                                                                               // 347
                filterObject.skip = query.skip;                                                                        // 348
                filterObject.limit = query.limit;                                                                      // 349
            }                                                                                                          // 350
                                                                                                                       //
            var trustee = Meteor.users.findOne({                                                                       // 351
                _id: user._id                                                                                          // 351
            });                                                                                                        // 351
            var clientAssets = Assets.find({                                                                           // 352
                clientId: clientId,                                                                                    // 352
                status: {                                                                                              // 352
                    $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                          // 352
                }                                                                                                      // 352
            }, filterObject).fetch();                                                                                  // 352
            var countOfAllItems = Assets.find({                                                                        // 353
                clientId: clientId,                                                                                    // 353
                status: {                                                                                              // 353
                    $ne: STATUS.numeric.DIGITAL_ASSET_DELETED                                                          // 353
                }                                                                                                      // 353
            }).fetch().length;                                                                                         // 353
            clientAssets.forEach(function (clientAsset) {                                                              // 354
                if (trustee.assetId.includes(clientAsset._id)) {                                                       // 355
                    clientAsset.name = decrypt(clientAsset.name);                                                      // 356
                    clientAsset.login = 'hidden';                                                                      // 357
                    clientAsset.password = 'hidden';                                                                   // 358
                    clientAsset.website = decrypt(clientAsset.website);                                                // 359
                    finalAssets.push(clientAsset);                                                                     // 360
                }                                                                                                      // 361
            });                                                                                                        // 362
            return {                                                                                                   // 363
                finalAssets: finalAssets,                                                                              // 363
                countOfAllItems: countOfAllItems                                                                       // 363
            };                                                                                                         // 363
        }                                                                                                              // 364
    });                                                                                                                // 25
}                                                                                                                      // 482
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]},"collections.js":["meteor/mongo",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/collections.js                                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
  Assets: function () {                                                                                                // 1
    return Assets;                                                                                                     // 1
  },                                                                                                                   // 1
  StripeSubscriptions: function () {                                                                                   // 1
    return StripeSubscriptions;                                                                                        // 1
  },                                                                                                                   // 1
  FutureEvents: function () {                                                                                          // 1
    return FutureEvents;                                                                                               // 1
  }                                                                                                                    // 1
});                                                                                                                    // 1
var Mongo = void 0;                                                                                                    // 1
module.import('meteor/mongo', {                                                                                        // 1
  "Mongo": function (v) {                                                                                              // 1
    Mongo = v;                                                                                                         // 1
  }                                                                                                                    // 1
}, 0);                                                                                                                 // 1
var Assets = new Mongo.Collection('assets');                                                                           // 2
var StripeSubscriptions = new Mongo.Collection('stripe_subscriptions');                                                // 3
var FutureEvents = new Mongo.Collection('future_events');                                                              // 4
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"constants.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/constants.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({                                                                                                        // 1
    ROLE: function () {                                                                                                // 1
        return ROLE;                                                                                                   // 1
    },                                                                                                                 // 1
    SECRET_KEY: function () {                                                                                          // 1
        return SECRET_KEY;                                                                                             // 1
    },                                                                                                                 // 1
    TEST_STRIPE_KEY: function () {                                                                                     // 1
        return TEST_STRIPE_KEY;                                                                                        // 1
    },                                                                                                                 // 1
    STRIPE_PLAN_ID: function () {                                                                                      // 1
        return STRIPE_PLAN_ID;                                                                                         // 1
    },                                                                                                                 // 1
    INTERCOM_APP_ID: function () {                                                                                     // 1
        return INTERCOM_APP_ID;                                                                                        // 1
    },                                                                                                                 // 1
    AWS_ACCESS_KEY_ID: function () {                                                                                   // 1
        return AWS_ACCESS_KEY_ID;                                                                                      // 1
    },                                                                                                                 // 1
    AWS_SECRET_ACCESS_KEY: function () {                                                                               // 1
        return AWS_SECRET_ACCESS_KEY;                                                                                  // 1
    },                                                                                                                 // 1
    ADMIN_EMAIL: function () {                                                                                         // 1
        return ADMIN_EMAIL;                                                                                            // 1
    },                                                                                                                 // 1
    STATUS: function () {                                                                                              // 1
        return STATUS;                                                                                                 // 1
    },                                                                                                                 // 1
    ASSET_STATUS_MESSAGE: function () {                                                                                // 1
        return ASSET_STATUS_MESSAGE;                                                                                   // 1
    },                                                                                                                 // 1
    TEMPLATES: function () {                                                                                           // 1
        return TEMPLATES;                                                                                              // 1
    }                                                                                                                  // 1
});                                                                                                                    // 1
var ROLE = {                                                                                                           // 1
    ADMIN: 'admin',                                                                                                    // 2
    ESTATE_PLANNER: 'estatePlanner',                                                                                   // 3
    CLIENT: 'client',                                                                                                  // 4
    TRUSTEE: 'trustee'                                                                                                 // 5
};                                                                                                                     // 1
var SECRET_KEY = 'tB3gwJ37E5518SlBzedIy0nW4k1Q1XZ7';                                                                   // 8
var TEST_STRIPE_KEY = 'sk_test_WHBb1hD54md1GhUuJv3KhRg5';                                                              // 9
var STRIPE_PLAN_ID = 'EveryDay10';                                                                                     // 13
var INTERCOM_APP_ID = 'h6dyxr8s';                                                                                      // 14
var AWS_ACCESS_KEY_ID = 'AKIAJCMFZ67B3KLFM3BQ';                                                                        // 15
var AWS_SECRET_ACCESS_KEY = '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';                                                // 16
var ADMIN_EMAIL = 'jeff@trustedheir.com';                                                                              // 18
var STATUS = {                                                                                                         // 20
    numeric: {                                                                                                         // 21
        ESTATE_PLANNER_NO_PAYMENT_INFO: 17,                                                                            // 22
        ESTATE_PLANNER_VISITED: 18,                                                                                    // 23
        ESTATE_PLANNER_PAYMENT_INFO: 15,                                                                               // 24
        ESTATE_PLANNER_ACCOUNT_ACTIVE: 12,                                                                             // 25
        ESTATE_PLANNER_ACCOUNT_CLOSED: 13,                                                                             // 26
        ESTATE_PLANNER_ACCOUNT_SUSPENDED: 14,                                                                          // 27
        CLIENT_INVITED: 1,                                                                                             // 28
        CLIENT_VISITED: 19,                                                                                            // 29
        CLIENT_ACCOUNT_CREATED: 11,                                                                                    // 30
        CLIENT_ACCOUNT_DELETED: 2,                                                                                     // 31
        CLIENT_ACTIVE: 3,                                                                                              // 32
        POST_PASSING_IN_PROGRESS: 16,                                                                                  // 33
        TRUSTEE_INVITED: 4,                                                                                            // 34
        TRUSTEE_VISITED: 20,                                                                                           // 35
        TRUSTEE_ACCEPTED: 5,                                                                                           // 36
        TRUSTEE_DECLINED: 6,                                                                                           // 37
        TRUSTEE_ACTIVE: 7,                                                                                             // 38
        TRUSTEE_ACCOUNT_DELETED: 10,                                                                                   // 39
        DIGITAL_ASSET_ACTIVE: 8,                                                                                       // 40
        DIGITAL_ASSET_DELETED: 9,                                                                                      // 41
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS: 21,                                                                     // 42
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED: 22,                                                            // 43
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED: 23,                                                      // 44
        DIGITAL_ASSET_COMPLETED: 24,                                                                                   // 45
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED: 25                                                               // 46
    },                                                                                                                 // 21
    literal: {                                                                                                         // 48
        ESTATE_PLANNER_NO_PAYMENT_INFO: 'No payment info',                                                             // 49
        ESTATE_PLANNER_VISITED: 'Visited',                                                                             // 50
        ESTATE_PLANNER_PAYMENT_INFO: 'Payment info',                                                                   // 51
        ESTATE_PLANNER_ACCOUNT_ACTIVE: 'Active',                                                                       // 52
        ESTATE_PLANNER_ACCOUNT_CLOSED: 'Account closed',                                                               // 53
        ESTATE_PLANNER_ACCOUNT_SUSPENDED: 'Account suspended',                                                         // 54
        CLIENT_INVITED: 'Invited',                                                                                     // 55
        CLIENT_VISITED: 'Visited',                                                                                     // 56
        CLIENT_ACCOUNT_CREATED: 'Account created',                                                                     // 57
        CLIENT_ACCOUNT_DELETED: 'Account deleted',                                                                     // 58
        CLIENT_ACTIVE: 'Active',                                                                                       // 59
        POST_PASSING_IN_PROGRESS: 'Post-passing in progress',                                                          // 60
        TRUSTEE_INVITED: 'Invited',                                                                                    // 61
        TRUSTEE_VISITED: 'Visited',                                                                                    // 62
        TRUSTEE_ACCEPTED: 'Accepted',                                                                                  // 63
        TRUSTEE_DECLINED: 'Declined',                                                                                  // 64
        TRUSTEE_ACTIVE: 'Active',                                                                                      // 65
        TRUSTEE_ACCOUNT_DELETED: 'Account deleted',                                                                    // 66
        DIGITAL_ASSET_ACTIVE: 'Active',                                                                                // 67
        DIGITAL_ASSET_DELETED: 'Deleted',                                                                              // 68
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS: 'Digital Asset in Post-passing Process',                                // 69
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED: 'Digital Asset in Post-passing Process - Re-opened',           // 70
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED: 'Digital Asset in Post-passing Process - Issue Reported',
        DIGITAL_ASSET_COMPLETED: 'Digital Asset completed',                                                            // 72
        DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED: 'Digital Asset viewed'                                           // 73
    }                                                                                                                  // 48
};                                                                                                                     // 20
var ASSET_STATUS_MESSAGE = {                                                                                           // 77
    DIGITAL_ASSET_ACTIVE: 'You have activated digital asset',                                                          // 78
    DIGITAL_ASSET_DELETED: 'You have canceled digital asset',                                                          // 79
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS: 'You are started Post-passing process',                                     // 80
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED: 'You are viewed digital asset',                                      // 81
    DIGITAL_ASSET_COMPLETED: 'Digital asset is completed',                                                             // 82
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED: 'Issue report is created',                                   // 83
    DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED: 'Digital asset is re-opened'                                       // 84
};                                                                                                                     // 77
var TEMPLATES = {                                                                                                      // 87
    ESTATE_PLANNER_WELCOME_EMAIL: '058f4f82-a689-4abf-8984-e5b3a4f9b4ac',                                              // 88
    ESTATE_PLANNER_REGISTRATION_CONFIRMATION: '5b195d8c-9a56-44b1-b12f-aa67ac92e02e',                                  // 89
    ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_CLOSED: 'ee0303f8-7bcd-4fda-9220-679321ea5f02',                      // 90
    ESTATE_PLANNER_ACCOUNT_REACTIVATED: '1abf61a6-dfec-477d-838f-52c7bb7a4ba3',                                        // 91
    ESTATE_PLANNER_ACCOUNT_SUSPENDED: '7741a716-0c5e-4d4a-a385-eb3dec737841',                                          // 92
    ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_ACTIVE: '517b1d0e-2c27-448e-94da-033f50bf0635',                      // 93
    FIRST_CLIENT_ADDED: '3ab7f020-aae7-47bf-becb-56080d844c2a',                                                        // 94
    ADD_CLIENT_ABANDONED: '03a368ac-ed8f-41b4-a10d-b50ed5d35868',                                                      // 95
    MONTHLY_SUMMARY: 'c68950dd-283f-4016-acc4-b6f42202d201',                                                           // 96
    MONTHLY_SUMMARY_INACTIVE: '4435a875-3406-4080-ada7-1fcd36be9e44',                                                  // 97
    ESTATE_PLANNER_PASSWORD_RESET: '92d719de-3c44-4c2c-93d0-b2803233f767',                                             // 98
    ESTATE_PLANNER_PASSWORD_CHANGED: 'c77dd18a-0c14-47e7-a7a5-7795b21d449e',                                           // 99
    CLIENT_INVITE: '5cc43c33-82de-4052-9cb3-d9402d6087c1',                                                             // 100
    CLIENT_WELCOME: '5c032319-01f5-41bb-b0b9-ddb7fbdf2121',                                                            // 101
    TRUSTEE_INVITE: '2f667779-db82-482c-85e1-155cdbe7a81f',                                                            // 102
    TRUSTEE_ACCEPTED: '435c61f4-7c75-471b-b5b5-2e7e69067243',                                                          // 103
    TRUSTEE_DECLINED: '70ad9dc2-8c24-490f-b8ac-a1b0c986fe51',                                                          // 104
    TRUSTEE_WELCOME: '68563d78-b373-4dab-a3bf-2093ec0e122b',                                                           // 105
    TRUSTEE_POST_PASSING: 'a3ff8106-2dee-40b2-9d13-2b131ba11f04',                                                      // 106
    CLIENT_PASSWORD_RESET: 'f002b1c9-d915-422f-afe2-af82bc19147c',                                                     // 107
    CLIENT_PASSWORD_CHANGED: '3a0ab827-2aa6-4592-b942-1d7e9b7919e4',                                                   // 108
    TWO_FACTOR_AUTHENTICATION: '1af27c3c-d7e4-4f6c-a71b-97631cd17253',                                                 // 109
    CLIENT_ACCOUNT_REACTIVATED: '4506dadb-d123-4312-ba18-d4f393b9fd38',                                                // 110
    CLIENT_ACCOUNT_CLOSED: 'de1e14c2-b513-4e0b-815d-e3cbd8229866',                                                     // 111
    CLIENT_INVITE_THREE_DAY_FOLLOW_UP: 'c2494f58-988b-45c4-909d-46f026b29906',                                         // 112
    CLIENT_INVITE_SEVEN_DAY_FOLLOW_UP: '31cd3948-23e7-4c2b-9c7d-870a7f403bcd',                                         // 113
    CLIENT_FIRST_DIGITAL_ASSET_ADDED: '84e109f6-cf19-414c-8c77-5fb88bfc9347',                                          // 114
    TRUSTEE_THREE_DAY_FOLLOW_UP: '7d97f894-2767-46cf-98ab-ae6bf251a7e8',                                               // 115
    TRUSTEE_SEVEN_DAY_FOLLOW_UP: '0f729196-9646-45a7-82e7-d5579f04e435',                                               // 116
    TRUSTEE_RESET_PASSWORD: '9e492a1e-769f-4edc-938d-dc261e7a2f0b',                                                    // 117
    ADMIN_RESET_PASSWORD: '6c914b37-05e7-4605-a2c7-c0dcd8760e7c',                                                      // 118
    MONTHLY_INVOICE_PAID: 'a3f9d39f-e99f-4234-9f7c-0daf90bfd2c3',                                                      // 119
    CREDIT_CARD_BILLING_UNSUCCESSFUL: '48b3cb6f-486a-40da-ba46-039e244425f5'                                           // 120
};                                                                                                                     // 87
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routes.js":["meteor/meteor","./collections","./constants","stripe","moment","crypto","body-parser",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/routes.js                                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var StripeSubscriptions = void 0;                                                                                      // 1
module.import('./collections', {                                                                                       // 1
    "StripeSubscriptions": function (v) {                                                                              // 1
        StripeSubscriptions = v;                                                                                       // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
var STATUS = void 0,                                                                                                   // 1
    TEMPLATES = void 0,                                                                                                // 1
    TEST_STRIPE_KEY = void 0,                                                                                          // 1
    STRIPE_PLAN_ID = void 0,                                                                                           // 1
    SECRET_KEY = void 0;                                                                                               // 1
module.import('./constants', {                                                                                         // 1
    "STATUS": function (v) {                                                                                           // 1
        STATUS = v;                                                                                                    // 1
    },                                                                                                                 // 1
    "TEMPLATES": function (v) {                                                                                        // 1
        TEMPLATES = v;                                                                                                 // 1
    },                                                                                                                 // 1
    "TEST_STRIPE_KEY": function (v) {                                                                                  // 1
        TEST_STRIPE_KEY = v;                                                                                           // 1
    },                                                                                                                 // 1
    "STRIPE_PLAN_ID": function (v) {                                                                                   // 1
        STRIPE_PLAN_ID = v;                                                                                            // 1
    },                                                                                                                 // 1
    "SECRET_KEY": function (v) {                                                                                       // 1
        SECRET_KEY = v;                                                                                                // 1
    }                                                                                                                  // 1
}, 2);                                                                                                                 // 1
var stripe = void 0;                                                                                                   // 1
module.import('stripe', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        stripe = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 3);                                                                                                                 // 1
var moment = void 0;                                                                                                   // 1
module.import('moment', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        moment = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 4);                                                                                                                 // 1
var crypto = void 0;                                                                                                   // 1
module.import('crypto', {                                                                                              // 1
    "default": function (v) {                                                                                          // 1
        crypto = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 5);                                                                                                                 // 1
var stripe_test = stripe(TEST_STRIPE_KEY);                                                                             // 7
                                                                                                                       //
var bodyParser = require('body-parser');                                                                               // 8
                                                                                                                       //
Picker.middleware(bodyParser.json());                                                                                  // 9
Picker.middleware(bodyParser.urlencoded({                                                                              // 10
    extended: false                                                                                                    // 10
}));                                                                                                                   // 10
var postRoutes = Picker.filter(function (req, res) {                                                                   // 12
    return req.method == 'POST';                                                                                       // 13
});                                                                                                                    // 14
                                                                                                                       //
function encrypt(data) {                                                                                               // 16
    var cipher = crypto.createCipher('aes192', SECRET_KEY);                                                            // 17
    var crypted = cipher.update(data, 'utf8', 'hex');                                                                  // 18
    crypted += cipher.final('hex');                                                                                    // 19
    return crypted;                                                                                                    // 20
}                                                                                                                      // 21
                                                                                                                       //
function decrypt(data) {                                                                                               // 23
    var decipher = crypto.createDecipher('aes192', SECRET_KEY);                                                        // 24
    var decrypted = decipher.update(data, 'hex', 'utf8');                                                              // 25
    decrypted += decipher.final('utf8');                                                                               // 26
    return decrypted;                                                                                                  // 27
}                                                                                                                      // 28
                                                                                                                       //
postRoutes.route('/api/stripe', function (params, req, res, next) {                                                    // 30
    var invoiceId = req.body.data.object.id;                                                                           // 31
    stripe_test.invoices.retrieve(invoiceId, Meteor.bindEnvironment(function (err, invoice) {                          // 32
        "use strict";                                                                                                  // 33
                                                                                                                       //
        if (err) {                                                                                                     // 34
            return new Meteor.Error(err);                                                                              // 35
        }                                                                                                              // 36
                                                                                                                       //
        if (invoice.next_payment_attempt || !invoice.total) {                                                          // 37
            return res.end('Information received');                                                                    // 38
        }                                                                                                              // 39
                                                                                                                       //
        var subscriptionDB = StripeSubscriptions.findOne({                                                             // 40
            subscriptionId: encrypt(invoice.subscription)                                                              // 40
        });                                                                                                            // 40
                                                                                                                       //
        if (subscriptionDB && invoice.paid) {                                                                          // 41
            stripe_test.subscriptions.del(invoice.subscription, Meteor.bindEnvironment(function (err, confirmation) {  // 42
                "use strict";                                                                                          // 43
                                                                                                                       //
                if (err) {                                                                                             // 44
                    return new Meteor.Error(err);                                                                      // 45
                }                                                                                                      // 46
                                                                                                                       //
                var nextDay = moment(new Date().setDate(new Date().getDate() + 1)).unix(); // todo delete after tests  // 47
                // let nextMonth = moment(new Date().setMonth(new Date().getMonth() + 1, 1)).unix();                   // 50
                                                                                                                       //
                stripe_test.subscriptions.create({                                                                     // 51
                    customer: decrypt(subscriptionDB.customerId),                                                      // 52
                    plan: STRIPE_PLAN_ID,                                                                              // 53
                    quantity: 0,                                                                                       // 54
                    trial_end: nextDay // trial_end: nextMonth                                                         // 55
                                                                                                                       //
                }, Meteor.bindEnvironment(function (err, subscription) {                                               // 51
                    if (err) {                                                                                         // 58
                        return new Meteor.Error(err);                                                                  // 59
                    }                                                                                                  // 60
                                                                                                                       //
                    StripeSubscriptions.update(subscriptionDB._id, {                                                   // 61
                        subscriptionId: encrypt(subscription.id),                                                      // 62
                        quantity: 0,                                                                                   // 63
                        billingStatus: 'Paid',                                                                         // 64
                        createdAt: new Date(),                                                                         // 65
                        $addToSet: {                                                                                   // 66
                            invoiceId: encrypt(invoice.id)                                                             // 67
                        }                                                                                              // 66
                    }, function (err, cb) {                                                                            // 61
                        if (err) {                                                                                     // 70
                            return new Meteor.Error(err);                                                              // 71
                        }                                                                                              // 72
                                                                                                                       //
                        var estatePlanner = Meteor.users.findOne({                                                     // 73
                            _id: subscriptionDB.estatePlannerId                                                        // 73
                        });                                                                                            // 73
                        var billingURL = Meteor.absoluteUrl('estate-planner/billing');                                 // 74
                        Email.send({                                                                                   // 75
                            from: 'jeff@trustedheir.com',                                                              // 76
                            to: estatePlanner.profile.email,                                                           // 77
                            headers: {                                                                                 // 78
                                'X-SMTPAPI': {                                                                         // 79
                                    'filters': {                                                                       // 80
                                        'templates': {                                                                 // 81
                                            'settings': {                                                              // 82
                                                'enable': 1,                                                           // 83
                                                'template_id': TEMPLATES.MONTHLY_INVOICE_PAID                          // 84
                                            }                                                                          // 82
                                        }                                                                              // 81
                                    },                                                                                 // 80
                                    'sub': {                                                                           // 88
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName],                 // 89
                                        '%NumberOfNewClients%': [subscriptionDB.quantity],                             // 90
                                        '%Month%': [moment(new Date()).format('MMMM')],                                // 91
                                        '%Year%': [moment(new Date()).format('YYYY')],                                 // 92
                                        '%Amount%': [invoice.total],                                                   // 93
                                        '%BillingURL%': ['<a href="' + billingURL + '">Link</a>']                      // 94
                                    }                                                                                  // 88
                                }                                                                                      // 79
                            }                                                                                          // 78
                        });                                                                                            // 75
                        return res.end('Information received');                                                        // 99
                    });                                                                                                // 100
                }));                                                                                                   // 101
            }));                                                                                                       // 103
        } else if (subscriptionDB && !invoice.paid) {                                                                  // 105
            (function () {                                                                                             // 105
                var estatePlanner = Meteor.users.findOne({                                                             // 106
                    _id: subscriptionDB.estatePlannerId                                                                // 106
                });                                                                                                    // 106
                Meteor.users.update({                                                                                  // 107
                    _id: id                                                                                            // 107
                }, {                                                                                                   // 107
                    $set: {                                                                                            // 108
                        status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_SUSPENDED,                                       // 109
                        dateOfSuspension: new Date()                                                                   // 110
                    },                                                                                                 // 108
                    $unset: {                                                                                          // 112
                        dateOfClose: 1                                                                                 // 113
                    }                                                                                                  // 112
                }, function (err, cb) {                                                                                // 107
                    if (err) {                                                                                         // 116
                        return new Meteor.Error(err);                                                                  // 117
                    }                                                                                                  // 118
                                                                                                                       //
                    var billingURL = Meteor.absoluteUrl('estate-planner/billing');                                     // 119
                    Email.send({                                                                                       // 120
                        from: 'jeff@trustedheir.com',                                                                  // 121
                        to: estatePlanner.profile.email,                                                               // 122
                        headers: {                                                                                     // 123
                            'X-SMTPAPI': {                                                                             // 124
                                'filters': {                                                                           // 125
                                    'templates': {                                                                     // 126
                                        'settings': {                                                                  // 127
                                            'enable': 1,                                                               // 128
                                            'template_id': TEMPLATES.CREDIT_CARD_BILLING_UNSUCCESSFUL                  // 129
                                        }                                                                              // 127
                                    }                                                                                  // 126
                                },                                                                                     // 125
                                'sub': {                                                                               // 133
                                    '%EstatePlannerFirstName%': [estatePlanner.profile.firstName],                     // 134
                                    '%NumberOfNewClients%': [subscription.quantity],                                   // 135
                                    '%Month%': [moment(new Date()).format('MMMM')],                                    // 136
                                    '%Year%': [moment(new Date()).format('YYYY')],                                     // 137
                                    '%Amount%': [subscription.plan.amount * subscription.quantity],                    // 138
                                    '%BillingURL%': ['<a href="' + billingURL + '">Link</a>']                          // 139
                                }                                                                                      // 133
                            }                                                                                          // 124
                        }                                                                                              // 123
                    });                                                                                                // 120
                    StripeSubscriptions.update(subscriptionDB._id, {                                                   // 144
                        billingStatus: 'Payment Declined',                                                             // 145
                        createdAt: new Date()                                                                          // 146
                    }, function (err, cb) {                                                                            // 144
                        if (err) {                                                                                     // 148
                            return new Meteor.Error(err);                                                              // 149
                        }                                                                                              // 150
                                                                                                                       //
                        Email.send({                                                                                   // 151
                            from: 'jeff@trustedheir.com',                                                              // 152
                            to: estatePlanner.profile.email,                                                           // 153
                            headers: {                                                                                 // 154
                                'X-SMTPAPI': {                                                                         // 155
                                    'filters': {                                                                       // 156
                                        'templates': {                                                                 // 157
                                            'settings': {                                                              // 158
                                                'enable': 1,                                                           // 159
                                                'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_SUSPENDED              // 160
                                            }                                                                          // 158
                                        }                                                                              // 157
                                    },                                                                                 // 156
                                    'sub': {                                                                           // 164
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]                  // 165
                                    }                                                                                  // 164
                                }                                                                                      // 155
                            }                                                                                          // 154
                        });                                                                                            // 151
                        return res.end('Information received');                                                        // 170
                    });                                                                                                // 171
                });                                                                                                    // 172
            })();                                                                                                      // 105
        } else {                                                                                                       // 173
            StripeSubscriptions.insert(invoice);                                                                       // 174
            return res.end('Information received');                                                                    // 175
        }                                                                                                              // 176
    }));                                                                                                               // 177
});                                                                                                                    // 179
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"main.js":["meteor/meteor","./constants",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Meteor = void 0;                                                                                                   // 1
module.import('meteor/meteor', {                                                                                       // 1
    "Meteor": function (v) {                                                                                           // 1
        Meteor = v;                                                                                                    // 1
    }                                                                                                                  // 1
}, 0);                                                                                                                 // 1
var ROLE = void 0,                                                                                                     // 1
    ADMIN_EMAIL = void 0;                                                                                              // 1
module.import('./constants', {                                                                                         // 1
    "ROLE": function (v) {                                                                                             // 1
        ROLE = v;                                                                                                      // 1
    },                                                                                                                 // 1
    "ADMIN_EMAIL": function (v) {                                                                                      // 1
        ADMIN_EMAIL = v;                                                                                               // 1
    }                                                                                                                  // 1
}, 1);                                                                                                                 // 1
Meteor.startup(function () {                                                                                           // 4
    process.env.MAIL_URL = 'smtp://oleksii.n:9R0bot$3@smtp.sendgrid.net:587';                                          // 6
    var admin = Accounts.findUserByEmail(ADMIN_EMAIL);                                                                 // 8
                                                                                                                       //
    if (!admin) {                                                                                                      // 9
        var _admin = {                                                                                                 // 10
            email: ADMIN_EMAIL,                                                                                        // 11
            username: 'jeff',                                                                                          // 12
            password: 'aaaaa1A!',                                                                                      // 13
            profile: {                                                                                                 // 14
                firstName: 'Jeff',                                                                                     // 15
                lastName: 'Perkins',                                                                                   // 16
                email: ADMIN_EMAIL                                                                                     // 17
            }                                                                                                          // 14
        };                                                                                                             // 10
        var newAdmin = Accounts.createUser(_admin);                                                                    // 20
        Roles.addUsersToRoles(newAdmin, [ROLE.ADMIN]);                                                                 // 21
        var createdAdmin = Accounts.findUserByEmail(ADMIN_EMAIL);                                                      // 22
        Meteor.users.update({                                                                                          // 23
            _id: createdAdmin._id                                                                                      // 23
        }, {                                                                                                           // 23
            $set: {                                                                                                    // 24
                'emails.0.createdAt': new Date(),                                                                      // 25
                'emails.0.currentEmail': true                                                                          // 26
            }                                                                                                          // 24
        });                                                                                                            // 23
    } // code to run on server at startup                                                                              // 29
                                                                                                                       //
                                                                                                                       //
    ServiceConfiguration.configurations.upsert({                                                                       // 32
        service: 'auth0'                                                                                               // 34
    }, {                                                                                                               // 33
        $set: {                                                                                                        // 36
            loginStyle: 'redirect',                                                                                    // 37
            domain: 'trustedheir.auth0.com',                                                                           // 38
            clientId: 'gCLx54OSHCSJr0X7mrNS8jE6H7BHkJEG',                                                              // 39
            clientSecret: '5ZXHLreqYSqXN-GXaOSpL4imbOVokWWLK5KWUn4hIV3OFfV1woRBeheXT-bBHkC0'                           // 40
        }                                                                                                              // 36
    });                                                                                                                // 35
});                                                                                                                    // 45
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]},"mup.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// mup.js                                                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {                                                                                                     // 1
  servers: {                                                                                                           // 2
    one: {                                                                                                             // 3
      host: '52.38.165.120',                                                                                           // 4
      username: 'ubuntu',                                                                                              // 5
      pem: '/home/oleksii/trustedheir_aws.pem' // password:                                                            // 6
      // or leave blank for authenticate from ssh-agent                                                                // 8
                                                                                                                       //
    }                                                                                                                  // 3
  },                                                                                                                   // 2
  meteor: {                                                                                                            // 12
    name: 'trustedheir',                                                                                               // 13
    path: '../trustedheir',                                                                                            // 14
    servers: {                                                                                                         // 15
      one: {}                                                                                                          // 16
    },                                                                                                                 // 15
    buildOptions: {                                                                                                    // 18
      serverOnly: true                                                                                                 // 19
    },                                                                                                                 // 18
    docker: {                                                                                                          // 21
      // image: 'kadirahq/meteord', // (optional)                                                                      // 22
      image: 'abernix/meteord:base'                                                                                    // 23
    },                                                                                                                 // 21
    env: {                                                                                                             // 25
      PORT: 34726,                                                                                                     // 26
      ROOT_URL: 'http://52.38.165.120',                                                                                // 27
      MONGO_URL: 'mongodb://avecezar17:trustedheir@ds141088.mlab.com:41088/trustedheir',                               // 28
      MAIL_URL: 'smtp://oleksii.n:9R0bot$3@smtp.sendgrid.net:587'                                                      // 29
    },                                                                                                                 // 25
    deployCheckWaitTime: 180,                                                                                          // 31
    mongo: {                                                                                                           // 32
      oplog: true,                                                                                                     // 33
      port: 27017,                                                                                                     // 34
      servers: {                                                                                                       // 35
        one: {}                                                                                                        // 36
      }                                                                                                                // 35
    }                                                                                                                  // 32
  }                                                                                                                    // 12
};                                                                                                                     // 1
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},{"extensions":[".js",".json",".html"]});
require("./server/methods/admin.js");
require("./server/methods/client.js");
require("./server/methods/common.js");
require("./server/methods/estatePlanner.js");
require("./server/methods/trustee.js");
require("./server/collections.js");
require("./server/constants.js");
require("./server/routes.js");
require("./mup.js");
require("./server/main.js");
//# sourceMappingURL=app.js.map
