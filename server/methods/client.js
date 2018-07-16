import {Meteor} from 'meteor/meteor';
import Future from 'fibers/future';
import moment from 'moment';
import schedule from 'node-schedule';

import {decrypt, encrypt} from './common';
import {Assets, FutureEvents} from '../collections';
import {ROLE, STATUS, TEMPLATES, ADMIN_EMAIL} from '../constants';

if (Meteor.isServer) {
    Meteor.methods({
        //-----------------------------------client's methods-------------------------------------------------
        createClientCreated: client => {
            const myFuture = new Future();
            Meteor.users.update({_id: client._id}, {$set: {status: STATUS.numeric.CLIENT_ACCOUNT_CREATED}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                Email.send({
                    from: ADMIN_EMAIL,
                    to: client.profile.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.CLIENT_WELCOME
                                    }
                                }
                            },
                            'sub': {
                                '%FirstName%': [client.profile.firstName]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });
                myFuture.return({message: 'You’ve successfully created your TrustedHeir account'});
            });
            return myFuture.wait();
        },
        createTrusteeInvited: (id, trustee, clientId) => {
            const myFuture = new Future();
            const tokenRecord = {
                token: Random.secret(),
                email: trustee.email,
                when: new Date(),
                reason: 'enroll'
            };
            const tokenClients = {
                token: tokenRecord.token,
                clientId: clientId,
            };
            const client = Meteor.users.findOne({_id: clientId});
            const urlWithToken = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'trustee/accept-reject');
            const enrollAccountUrl = `${urlWithToken}?id=${clientId}`;
            Meteor.users.update({_id: id}, {
                $set: {
                    status: STATUS.numeric.TRUSTEE_INVITED,
                    'services.password.reset': tokenRecord,
                    'emails.0.createdAt': new Date(),
                    'emails.0.currentEmail': true
                },
                $addToSet: {
                    'services.tokenClients': tokenClients
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                Roles.addUsersToRoles(id, [ROLE.TRUSTEE]);
                Email.send({
                    from: ADMIN_EMAIL,
                    to: trustee.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.TRUSTEE_INVITE
                                    }
                                }
                            },
                            'sub': {
                                '%VerificationURL%': [enrollAccountUrl],
                                '%ClientFirstName%': [client.profile.firstName],
                                '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],
                                '%TrusteeFirstName%': [trustee.profile.firstName],
                                '%ClientNotes%': [trustee.profile.note]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });

                const date = new Date(moment(new Date().setDate(new Date().getDate() + 3)).format('YYYY, M, D'));
                const futureEvent3 = {
                    name: `Trustee 3-day Follow-up ${id}`,
                    type: 'Trustee 3-day Follow-up',
                    createdAt: new Date(),
                    date: date,
                    userId: id
                };
                FutureEvents.insert(futureEvent3);
                const job3 = schedule.scheduleJob(futureEvent3.name, futureEvent3.date, Meteor.bindEnvironment(() => {
                    let myFuture = new Future();
                    let trustee = Meteor.users.findOne({_id: id});
                    FutureEvents.remove({name: `Trustee 3-day Follow-up ${id}`});
                    if (trustee.status === STATUS.numeric.TRUSTEE_INVITED) {
                        Email.send({
                            from: ADMIN_EMAIL,
                            to: trustee.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.TRUSTEE_THREE_DAY_FOLLOW_UP
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%VerificationURL%': [enrollAccountUrl],
                                        '%TrusteeFirstName%': [trustee.profile.firstName],
                                        '%ClientFirstName%': [client.profile.firstName]
                                    },
                                },
                                'Content-Type': 'text/html'
                            }
                        });
                        let date = new Date(moment(new Date().setDate(new Date().getDate() + 4)).format('YYYY, M, D'));
                        let futureEvent7 = {
                            name: `Trustee 7-day Follow-up ${id}`,
                            type: 'Trustee 7-day Follow-up',
                            createdAt: new Date(),
                            date: date,
                            userId: id
                        };
                        FutureEvents.insert(futureEvent7);
                        let job7 = schedule.scheduleJob(futureEvent7.name, futureEvent7.date, Meteor.bindEnvironment(() => {
                            let myFuture = new Future();
                            let trustee = Meteor.users.findOne({_id: id});
                            FutureEvents.remove({name: `Trustee 7-day Follow-up ${id}`});
                            if (trustee.status === STATUS.numeric.TRUSTEE_INVITED) {
                                Email.send({
                                    from: ADMIN_EMAIL,
                                    to: trustee.profile.email,
                                    headers: {
                                        'X-SMTPAPI': {
                                            'filters': {
                                                'templates': {
                                                    'settings': {
                                                        'enable': 1,
                                                        'template_id': TEMPLATES.TRUSTEE_SEVEN_DAY_FOLLOW_UP
                                                    }
                                                }
                                            },
                                            'sub': {
                                                '%VerificationURL%': [enrollAccountUrl],
                                                '%TrusteeFirstName%': [trustee.profile.firstName],
                                                '%ClientFirstName%': [client.profile.firstName]
                                            },
                                        },
                                        'Content-Type': 'text/html'
                                    }
                                });

                            }
                            return myFuture.wait();
                        }));
                    }
                    return myFuture.wait();
                }));

                myFuture.return({message: `You've successfully added ${trustee.profile.firstName} ${trustee.profile.lastName} as a new trustee. TrustedHeir will email your trustee and ask them to accept or reject their role.`});
            });
            return myFuture.wait();
        },
        getAssetsOfTrustee: (trusteeId, clientId, query) => {
            const trustee = Meteor.users.findOne({_id: trusteeId});
            if (trustee && trustee.assetId) {
                const finalAssets = [];
                const filterObject = {
                    sort: {createdAt: -1}
                };
                if (query) {
                    filterObject.skip = query.skip;
                    filterObject.limit = query.limit;
                }
                const assets = Assets.find({
                    _id: {$in: trustee.assetId},
                    status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}
                }, filterObject).fetch();
                const countOfAllItems = Assets.find({
                    _id: {$in: trustee.assetId},
                    status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}
                }).fetch().length;
                assets.forEach(asset => {
                    "use strict";
                    if (asset.clientId === clientId) {
                        const trustees = [];
                        asset.name = decrypt(asset.name);
                        asset.login = decrypt(asset.login);
                        asset.password = decrypt(asset.password);
                        asset.password = asset.password.replace(/./g, '*');
                        asset.website = decrypt(asset.website);
                        asset.trusteeId.forEach(trusteeId => {
                            const clientTrustee = Meteor.users.findOne({_id: trusteeId._id});
                            trustees.push(clientTrustee);
                        });
                        finalAssets.push(Object.assign(asset, {trustees: trustees}))
                    }
                });
                return {trustee: trustee, finalAssets, countOfAllItems};
            } else {
                return {trustee: trustee};
            }
        },
        addExistingTrustee: (trustee, clientId) => {
            "use strict";
            const myFuture = new Future();
            const existingTrustee = Accounts.findUserByEmail(trustee.email);
            const clientIds = existingTrustee.clientId;
            if (existingTrustee.roles.includes(ROLE.ADMIN) || existingTrustee.roles.includes(ROLE.ESTATE_PLANNER)) {
                myFuture.return({message: `This user cannot be added as your trustee`});
            } else if (clientIds && clientIds.includes(clientId)) {
                myFuture.return({message: `You've already added this trustee`});
            } else if (existingTrustee.roles.includes(ROLE.CLIENT) && !existingTrustee.emails[0].verified) {
                myFuture.return({message: `This user cannot be added as your trustee before finishing registration`});
            } else {
                const client = Meteor.users.findOne({_id: clientId});
                const tokenRecord = {
                    clientId: clientId
                };
                if (existingTrustee.emails[0].verified) {
                    tokenRecord.token = Random.secret();
                } else {
                    tokenRecord.token = existingTrustee.services.password.reset.token;
                }
                let addToSet = {
                    'services.tokenClients': tokenRecord,
                };
                if (existingTrustee.roles.includes(ROLE.CLIENT)) {
                    addToSet.roles = ROLE.TRUSTEE
                }
                const urlWithToken = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'trustee/accept-reject');
                const enrollAccountUrl = `${urlWithToken}?id=${clientId}`;
                Meteor.users.update({_id: existingTrustee._id}, {
                    $addToSet: addToSet
                }, (err, cb) => {
                    if (err) {
                        myFuture.throw(err);
                    }
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: existingTrustee.profile.email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.TRUSTEE_INVITE
                                        }
                                    }
                                },
                                'sub': {
                                    '%VerificationURL%': [enrollAccountUrl],
                                    '%ClientFirstName%': [client.profile.firstName],
                                    '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],
                                    '%TrusteeFirstName%': [existingTrustee.profile.firstName],
                                    '%ClientNotes%': [existingTrustee.profile.note]
                                },
                            },
                            'Content-Type': 'text/html'
                        }
                    });
                    myFuture.return({
                        message: `You've successfully added ${existingTrustee.profile.firstName} ${existingTrustee.profile.lastName} as a new trustee. TrustedHeir will email your trustee and ask them to accept or reject their role.`,
                        existingTrustee
                    });
                });
            }
            return myFuture.wait();
        },
        addTrusteeDigitalAsset: (trusteesIds, assetId) => {
            const myFuture = new Future();
            const errors = [];
            trusteesIds.forEach(trusteeId => {
                Meteor.users.update({_id: trusteeId._id}, {
                    $addToSet: {
                        assetId: assetId
                    }
                }, (err, cb) => {
                    if (err) {
                        errors.push(err);
                    }
                });
            });
            if (errors.length) {
                myFuture.throw(errors[0]);
            }
            myFuture.return({message: `Trustee's digital asset added`});
            return myFuture.wait();
        },
        getTrusteesByClientId: (clientId, query) => {
            const filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            const trustees = Meteor.users.find({$or: [{clientId}, {'services.tokenClients.clientId': clientId}]}, filterObject).fetch();
            const countOfAllItems = Meteor.users.find({$or: [{clientId}, {'services.tokenClients.clientId': clientId}]}).fetch().length;
            trustees.forEach(trustee => {
                "use strict";
                delete trustee.services;
            });
            return {trustees, countOfAllItems};
        },
        removeTrustee: id => {
            let myFuture = new Future();
            Meteor.users.update({_id: id}, {$set: {status: STATUS.numeric.TRUSTEE_ACCOUNT_DELETED}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                myFuture.return({message: 'Account removed'});
            });
            return myFuture.wait();
        },
        createAsset: (asset, client) => {
            const myFuture = new Future();
            asset.name = encrypt(asset.name);
            asset.login = encrypt(asset.login);
            asset.password = encrypt(asset.password);
            asset.website = encrypt(asset.website);
            Assets.insert(asset, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const assetId = cb;
                const clientsAssets = Assets.find({clientId: asset.clientId}).fetch();
                if (clientsAssets.length < 2) {

                    Meteor.users.update({_id: client._id}, {$set: {status: STATUS.numeric.CLIENT_ACTIVE}}, (err, cb) => {
                        if (err) {
                            myFuture.throw(err);
                        }
                        Email.send({
                            from: ADMIN_EMAIL,
                            to: client.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.CLIENT_FIRST_DIGITAL_ASSET_ADDED
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%ClientFirstName%': [client.profile.firstName]
                                    },
                                },
                                'Content-Type': 'text/html'
                            }
                        });
                        myFuture.return({message: 'New Asset created. You are Active Client', assetId: assetId});
                    });
                } else myFuture.return({message: 'New Asset created', assetId: assetId});
            });
            // } else {
            //     myFuture.throw(new Meteor.Error('An asset with this name already exists'));
            // }
            return myFuture.wait();
        },
        addTrusteesToAsset: (trustees, id) => {
            "use strict";
            const myFuture = new Future();
            Assets.update({_id: id}, {
                $set: {
                    trusteeId: trustees
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                myFuture.return({ok: 1});
            });
            return myFuture.wait();
        },
        //-----------------------------------client's methods-------------------------------------------------

    });
}
