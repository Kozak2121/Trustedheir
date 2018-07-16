import {Meteor} from 'meteor/meteor';
import Future from 'fibers/future';
import {Assets, StripeSubscriptions} from '../collections';
import {ROLE, STATUS, TEMPLATES, SECRET_KEY, STRIPE_KEY, INTERCOM_APP_ID, ADMIN_EMAIL, ADMIN_ADDITIONAL_EMAIL} from '../constants';
import crypto from 'crypto';
import stripe from 'stripe';
let stripe_test = stripe(STRIPE_KEY);

export const encrypt = (data) => {
    let cipher = crypto.createCipher('aes192', SECRET_KEY);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

export const decrypt = (data) => {
    let decipher = crypto.createDecipher('aes192', SECRET_KEY);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

if (Meteor.isServer) {
    Meteor.methods({

        //-----------------------------------common methods-------------------------------------------------

        setRecentActivity: id => {
            "use strict";
            Meteor.users.update({_id: id}, {$set: {recentActivity: {createdAt: new Date()}}});
        },
        cancelAccount: user => {
            "use strict";
            const enrollAccountUrl = Meteor.absoluteUrl(`admin/estate-planner-center/${user._id}`);
            Email.send({
                from: user.profile.email,
                to: ADMIN_ADDITIONAL_EMAIL,
                headers: {
                    'X-SMTPAPI': {
                        'filters': {
                            'templates': {
                                'settings': {
                                    'enable': 1,
                                    'template_id': TEMPLATES.ADMIN_RESET_PASSWORD
                                }
                            }
                        },
                        'sub': {
                            '%VerificationURL%': [enrollAccountUrl],
                        },
                    },
                    'Content-Type' : 'text/html'
                }
            });
            return ({message: 'You asked Admin to cancel your account!'});
        },
        resetUserPassword: email => {
            const user = Accounts.findUserByEmail(email);
            if (!user) {
              return ({message: 'You are not registered yet', ok: 0});
            }
            const myFuture = new Future();
            const tokenRecord = {
                token: Random.secret(),
                email: email,
                when: new Date(),
                reason: 'reset'
            };
            const enrollAccountUrl = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'reset-account');
            Meteor.users.update({_id: user._id}, {
                $set: {
                    'services.password.reset': tokenRecord
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                if (user.roles[0] === ROLE.ADMIN) {
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.ADMIN_RESET_PASSWORD
                                        }
                                    }
                                },
                                'sub': {
                                    '%VerificationURL%': [enrollAccountUrl],
                                },
                            },
                            'Content-Type' : 'text/html'
                        }
                    });
                    myFuture.return({message: 'You successfully reset you password. Please, visit your email', ok: 1});
                } else if (user.roles[0] === ROLE.ESTATE_PLANNER) {
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.ESTATE_PLANNER_PASSWORD_RESET
                                        }
                                    }
                                },
                                'sub': {
                                    '%VerificationURL%': [enrollAccountUrl],
                                },
                            },
                            'Content-Type' : 'text/html'
                        }
                    });
                    myFuture.return({message: 'You successfully reset you password. Please, visit your email', ok: 1});
                } else if (user.roles.includes(ROLE.CLIENT)) {
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.CLIENT_PASSWORD_RESET
                                        }
                                    }
                                },
                                'sub': {
                                    '%VerificationURL%': [enrollAccountUrl],
                                },
                            },
                            'Content-Type' : 'text/html'
                        }
                    });
                    myFuture.return({message: 'You successfully reset you password. Please, visit your email', ok: 1});
                } else if (user.roles[0] === ROLE.TRUSTEE) {
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.TRUSTEE_RESET_PASSWORD
                                        }
                                    }
                                },
                                'sub': {
                                    '%VerificationURL%': [enrollAccountUrl],
                                },
                            },
                            'Content-Type' : 'text/html'
                        }
                    });
                    myFuture.return({message: 'You successfully reset you password. Please, visit your email', ok: 1});
                }
            });
            return myFuture.wait();
        },
        getUserById: id => {
            const user = Meteor.users.findOne({_id: id});
            if (user) {
                delete user.services;
                user.intercomAppId = INTERCOM_APP_ID;
            }
            return user;
        },
        updateUser: (id, userInfo) => {
            const myFuture = new Future();
            const updatedUserInfo = {username: userInfo.username};
            const profile = userInfo.profile;
            const keys = Object.keys(profile);
            let i = Object.keys(profile).length;
            for (; i--;) {
                let mongoKey = 'profile.' + keys[i];
                Object.assign(updatedUserInfo, {[mongoKey]: profile[keys[i]]});
            }

            Meteor.users.update({_id: id}, {$set: updatedUserInfo}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                let user = Meteor.users.findOne({_id: id});
                delete user.services;
                myFuture.return({message: `You've successfully updated your account information`, user: user});
            });
            return myFuture.wait();
        },
        changeEmail: (userId, newEmail) => {
            const myFuture = new Future();
            const emails = [{
                address: newEmail,
                verified: false,
                createdAt: new Date(),
                currentEmail: true
            }];
            Meteor.users.findOne({_id: userId}).emails.forEach(emailObj => {
                "use strict";
                if (emailObj.address === newEmail && !emailObj.verified) {
                    return;
                } else if (emailObj.address === newEmail && emailObj.verified) {
                    emails[0].verified = true;
                    return;
                }
                delete emailObj.currentEmail;
                emails.push(emailObj);
            });
            Meteor.users.update({_id: userId}, {
                $set: {
                    'profile.email': newEmail,
                    emails: emails
                    // 'emails.0.address': newEmail,
                    // 'services.password.reset.email': newEmail
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const stripeSubscription = StripeSubscriptions.findOne({estatePlannerId: userId});
                if (stripeSubscription) {
                    stripeSubscription.customerId = decrypt(stripeSubscription.customerId);
                    stripe_test.customers.update(stripeSubscription.customerId, {email: newEmail}, Meteor.bindEnvironment((err, customer) => {
                        "use strict";
                        if (err) {
                            return myFuture.throw(new Meteor.Error(err));
                        }
                        myFuture.return({message: 'You successfully changed the email address for your TrustedHeir account'});
                    }))
                } else myFuture.return({message: 'You successfully changed the email address for your TrustedHeir account'});
            });
            return myFuture.wait();
        },
        checkCurrentEmail: email => {
            "use strict";
            const result = {ok: 0};
            const user = Accounts.findUserByEmail(email);
            if (user) {
                user.emails.forEach(emailObj => {
                    if (emailObj.address === email && emailObj.currentEmail) {
                        result.ok = 1;
                    }
                })
            }
            return result;
        },
        deleteUser: id => {
            Meteor.users.remove({_id: id});
            return ({message: 'Account deleted'});
        },
        updateAsset: (assetId, asset) => {
            const myFuture = new Future();

            asset.name = encrypt(asset.name);
            asset.login = encrypt(asset.login);
            asset.password ? asset.password = encrypt(asset.password) : null;
            asset.website = encrypt(asset.website);

            Assets.update({_id: assetId}, {$set: asset}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const asset = Assets.findOne({_id: assetId});
                const clientId = asset.clientId;
                myFuture.return({message: `You've successfully updated a digital asset`, clientId});
            });
            return myFuture.wait();
        },
        removeAsset: id => {
            const myFuture = new Future();
            Assets.update({_id: id}, {
                $set: {
                    status: STATUS.numeric.DIGITAL_ASSET_DELETED
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                myFuture.return({message: 'Digital asset removed'});
            });
            return myFuture.wait();
        },
        loginByToken: token => {
            const myFuture = new Future();
            const user = Meteor.users.findOne({'services.trusteeToken': {$elemMatch: {token: token}}});
            if (user) {
                Meteor.users.update({_id: user._id}, {$pull: {'services.trusteeToken': {token: token}}}, (err, cb) => {
                    if (err) {
                        myFuture.throw(err);
                    }
                    delete user.services;
                    myFuture.return({user: user, ok: 1});
                });
            } else {
                myFuture.return({ok: 0})
            }
            return myFuture.wait();
        },
        getUserByToken: token => {
            const user = Meteor.users.findOne({'services.password.reset.token': token});
            if (user) {
                delete user.services;
            }
            return user;
        },
        getEstatePlannerByToken: token => {
            const myFuture = new Future();
            const estatePlanner = Meteor.users.findOne({'services.password.reset.token': token});
            if (estatePlanner) {
                Meteor.users.update({_id: estatePlanner._id}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_VISITED}}, (err, cb) => {
                    if (err) {
                        myFuture.throw(err);
                    }
                    delete estatePlanner.services;
                    if (estatePlanner.tempPassword) {
                        myFuture.return({
                            message: 'Account visited',
                            estatePlanner: Object.assign(estatePlanner, {status: STATUS.numeric.ESTATE_PLANNER_VISITED}),
                            ok: 1
                        });
                    } else {
                        myFuture.return({
                            message: 'Account visited',
                            estatePlanner: Object.assign(estatePlanner, {status: STATUS.numeric.ESTATE_PLANNER_VISITED}),
                            ok: 2
                        });
                    }
                });
            } else myFuture.return({ok: 0});
            return myFuture.wait();
        },
        getClientByToken: token => {
            const myFuture = new Future();
            const client = Meteor.users.findOne({'services.password.reset.token': token});
            if (client) {
                if (client.status === STATUS.numeric.CLIENT_ACCOUNT_DELETED) {
                    myFuture.return({message: 'Your account was deleted', client});
                } else {
                    Meteor.users.update({_id: client._id}, {$set: {status: STATUS.numeric.CLIENT_VISITED}}, (err, cb) => {
                        if (err) {
                            myFuture.throw(err);
                        }
                        client = Meteor.users.findOne({'services.password.reset.token': token});
                        delete client.services;
                        myFuture.return({message: 'Account visited', client});
                    });
                }
            } else myFuture.return(client);
            return myFuture.wait();
        },
        getTrusteeByToken: (token, clientId) => {
            const myFuture = new Future();
            const trustee = Meteor.users.findOne({'services.tokenClients': {$elemMatch: {token: token}}});
            if (trustee && !trustee.services.password.reset) {
                let client = Meteor.users.findOne({_id: clientId});
                delete client.services;
                delete trustee.services;
                trustee.reason = 'acceptReject';
                myFuture.return({message: 'Account visited', trustee, client});
            } else if (trustee && trustee.services.password.reset) {
                Meteor.users.update({_id: trustee._id}, {$set: {status: STATUS.numeric.TRUSTEE_VISITED}}, (err, cb) => {
                    if (err) {
                        myFuture.throw(err);
                    }
                    let client = Meteor.users.findOne({_id: clientId});
                    delete client.services;
                    delete trustee.services;
                    myFuture.return({message: 'Account visited', trustee, client});
                });
            } else myFuture.return(trustee);
            return myFuture.wait();
        },
        getAssetsByClientId: (clientId, roles, query) => {
            let queryObj;
            if (roles.includes(ROLE.ADMIN)) {
                queryObj = {clientId: clientId}
            } else {
                queryObj = {clientId: clientId, status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}}
            }
            const finalAssets = [];
            const client = Meteor.users.findOne({_id: clientId});
            delete client.services;
            let filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            let assets = Assets.find(queryObj, filterObject).fetch();
            const countOfAllItems = Assets.find(queryObj).fetch().length;
            assets.forEach(asset => {

                asset.name = decrypt(asset.name);
                asset.login = decrypt(asset.login);
                asset.password = decrypt(asset.password);
                asset.password = asset.password.replace(/./g, '*');
                asset.website = decrypt(asset.website);

                // todo
                asset.clientStatus = client.status;

                let trustees = [];
                if (asset.trusteeId) {
                    asset.trusteeId.forEach(trusteeId => {
                        "use strict";
                        let trustee = Meteor.users.findOne({_id: trusteeId._id});
                        if (trustee) {
                            delete trustee.services;
                            trustees.push(trustee);
                        }
                    });
                }
                finalAssets.push(Object.assign(asset, {trustees: trustees}));
            });
            return {finalAssets, countOfAllItems};
        },
        getAssetById: assetId => {
            const asset = Assets.findOne({'_id': assetId});
            if (asset) {

                asset.name = decrypt(asset.name);
                asset.login = decrypt(asset.login);
                asset.password = decrypt(asset.password);
                asset.website = decrypt(asset.website);

                const client = Meteor.users.findOne({_id: asset.clientId});
                delete client.services;
                let trustees = [];
                if (asset.trusteeId) {
                    asset.trusteeId.forEach(trusteeId => {
                        "use strict";
                        let trustee = Meteor.users.findOne({_id: trusteeId._id});
                        if (trustee) {
                            delete trustee.services;
                            trustees.push(trustee);
                        }
                    });
                }
                return Object.assign(asset, {trustees: trustees, client: client});
            }
        }

        //-----------------------------------common methods-------------------------------------------------

    });

    let preventDosAttack = {
        userId: userId => {
            return true
        },
        type: 'method',
        name: 'checkCurrentEmail'
    };

    DDPRateLimiter.addRule(preventDosAttack, 1, 1000);

}
