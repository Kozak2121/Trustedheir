import {Meteor} from 'meteor/meteor';
import Future from 'fibers/future';

import {Assets} from '../collections';
import {ROLE, STATUS, TEMPLATES, SECRET_KEY, STRIPE_KEY, ASSET_STATUS_MESSAGE, ADMIN_EMAIL} from '../constants';
import {decrypt} from './common';

if (Meteor.isServer) {
    Meteor.methods({
        //-----------------------------------trustee's methods-------------------------------------------------
        acceptTrustee: (trustee, clientId) => {
            const myFuture = new Future();
            const clientsAssetsIds = [];
            const clientsAssets = Assets.find({clientId: clientId, trusteeId: { $elemMatch: { _id: trustee._id } }}).fetch();
            clientsAssets.forEach(asset => {
                "use strict";
                clientsAssetsIds.push(asset._id);
            });
            const updateObj = {
                $addToSet: {
                    clientId: clientId,
                    assetId: {$each: clientsAssetsIds}
                },
                $pull: {
                    'services.tokenClients': {
                    clientId: clientId
                    }
                }
            };
            if (!trustee.roles.includes(ROLE.CLIENT)) {
                updateObj.$set = {
                  status: STATUS.numeric.TRUSTEE_ACCEPTED
                }
            }
            Meteor.users.update({_id: trustee._id}, updateObj, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }

                const client = Meteor.users.findOne({_id: clientId});

                Email.send({
                    from: ADMIN_EMAIL,
                    to: client.profile.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.TRUSTEE_ACCEPTED
                                    }
                                }
                            },
                            'sub': {
                                '%ClientFirstName%': [client.profile.firstName],
                                '%InvitedTrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName],
                                '%InvitedTrusteeFirstName%': [trustee.profile.firstName]
                            },
                        },
                        'Content-Type' : 'text/html'
                    }
                });

                Email.send({
                    from: ADMIN_EMAIL,
                    to: trustee.profile.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.TRUSTEE_WELCOME
                                    }
                                }
                            },
                            'sub': {
                                '%FirstName%': [trustee.profile.firstName],
                                '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName]
                            },
                        },
                        'Content-Type' : 'text/html'
                    }
                });

                myFuture.return({message: 'Trustee accepted'});
            });
            return myFuture.wait();
        },
        rejectTrustee: (trustee, clientId) => {
            const myFuture = new Future();
            const user = Meteor.users.findOne({_id: trustee._id});
            if ((user && user.services.tokenClients.length > 1) || ((user && user.emails[0].verified) && trustee.roles.length === 1)) {
                Meteor.users.update({_id: trustee._id}, {
                    $pull: {
                        'services.tokenClients': {
                            clientId: clientId
                        }
                    }}, (err, cb) => {
                    if (err) {
                        myFuture.throw(err);
                    }

                    const client = Meteor.users.findOne({_id: clientId});

                    Email.send({
                        from: ADMIN_EMAIL,
                        to: client.profile.email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.TRUSTEE_DECLINED
                                        }
                                    }
                                },
                                'sub': {
                                    '%ClientFirstName%': [client.profile.firstName],
                                    '%TrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName]
                                },
                            },
                            'Content-Type' : 'text/html'
                        }
                    });

                    const errors = [];
                    const clientsAssets = Assets.find({clientId: clientId, trusteeId: { $elemMatch: { _id: trustee._id } }}).fetch();
                    clientsAssets.forEach(asset => {
                        "use strict";
                        Assets.update({_id: asset._id}, {$pull: { trusteeId: { _id: trustee._id } }}, (err, cb) => {
                            if (err) {
                                errors.push(err);
                            }
                        })
                    });
                    if (errors.length) {
                        myFuture.throw(errors[0]);
                    }

                    myFuture.return({message: 'You have rejected the invitation.'});
                });
            } else {
                if (trustee.roles.includes(ROLE.CLIENT)) {
                    Roles.removeUsersFromRoles(trustee._id, ROLE.TRUSTEE);
                    Meteor.users.update({_id: trustee._id}, {
                        $pull: {
                            'services.tokenClients': {
                                clientId: clientId
                            }
                        }}, (err, cb) => {
                        if (err) {
                            myFuture.throw(err);
                        }

                        let client = Meteor.users.findOne({_id: clientId});

                        Email.send({
                            from: ADMIN_EMAIL,
                            to: client.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                              'template_id': TEMPLATES.TRUSTEE_DECLINED
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%ClientFirstName%': [client.profile.firstName],
                                        '%TrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName]
                                    },
                                },
                                'Content-Type' : 'text/html'
                            }
                        });

                        const errors = [];
                        const clientsAssets = Assets.find({clientId: clientId, trusteeId: { $elemMatch: { _id: trustee._id } }}).fetch();
                        clientsAssets.forEach(asset => {
                            "use strict";
                            Assets.update({_id: asset._id}, {$pull: { trusteeId: { _id: trustee._id } }}, (err, cb) => {
                                if (err) {
                                    errors.push(err);
                                }
                            })
                        });
                        if (errors.length) {
                            myFuture.throw(errors[0]);
                        }

                        myFuture.return({message: 'You have rejected the invitation.'});
                    });
                } else {
                    Meteor.users.update({_id: trustee._id}, {
                        $set: {
                            status: STATUS.numeric.TRUSTEE_DECLINED,
                            'emails.0.verified': true
                        },
                        $unset: {
                            'services.password.reset': 1
                        }}, (err, cb) => {
                        if (err) {
                            myFuture.throw(err);
                        }

                        let client = Meteor.users.findOne({_id: clientId});

                        Email.send({
                            from: ADMIN_EMAIL,
                            to: client.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.TRUSTEE_DECLINED
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%ClientFirstName%': [client.profile.firstName],
                                        '%TrusteeFullName%': [trustee.profile.firstName + ' ' + trustee.profile.lastName]
                                    },
                                },
                                'Content-Type' : 'text/html'
                            }
                        });

                        const errors = [];
                        const clientsAssets = Assets.find({clientId: clientId, trusteeId: { $elemMatch: { _id: trustee._id } }}).fetch();
                        clientsAssets.forEach(asset => {
                            "use strict";
                            Assets.update({_id: asset._id}, {$pull: { trusteeId: { _id: trustee._id } }}, (err, cb) => {
                                if (err) {
                                    errors.push(err);
                                }
                            })
                        });
                        if (errors.length) {
                            myFuture.throw(errors[0]);
                        }
                        myFuture.return({message: 'You have rejected the invitation.'});
                    });
                }
            }
            return myFuture.wait();
        },
        createTrusteeActive: id => {
            const myFuture = new Future();
            Meteor.users.update({_id: id}, {$set: {status: STATUS.numeric.TRUSTEE_ACTIVE}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const trustee = Meteor.users.findOne({_id: id});
                delete trustee.services;
                myFuture.return({message: 'You’ve successfully created your TrustedHeir account', trustee});
            });
            return myFuture.wait();
        },
        changeAssetStatus: (assetId, status) => {
            const myFuture = new Future();
            let message;
            for (let key in STATUS.numeric) {
                if (status === STATUS.numeric[key]) {
                    message = ASSET_STATUS_MESSAGE[key];
                }
            }
            Assets.update({_id: assetId}, {$set: {status: status}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                myFuture.return({message: message});
            });
            return myFuture.wait();
        },
        addAssetToCompleted: (assetId, trusteeId) => {
            "use strict";
            const myFuture = new Future();
            Assets.update({_id: assetId}, {$set: {activeTrusteeId: trusteeId}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                myFuture.return({ok: 1});
            });
            return myFuture.wait();
        },
        getAssetByTrustee: assetId => {
            const asset = Assets.findOne({_id: assetId, status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}});
            if (asset) {
                const client = Meteor.users.findOne({_id: asset.clientId, status: {$ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED}});
                if (client) {
                    delete client.services;
                }
                if (client &&
                    client.status === STATUS.numeric.POST_PASSING_IN_PROGRESS &&
                    (
                        asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS ||
                        asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_VIEWED ||
                        asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_REOPENED ||
                        asset.status === STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS_ISSUE_REPORTED ||
                        asset.status === STATUS.numeric.DIGITAL_ASSET_COMPLETED
                    )
                ) {
                    asset.name = decrypt(asset.name);
                    asset.login = decrypt(asset.login);
                    asset.password = decrypt(asset.password);
                    asset.website = decrypt(asset.website);
                } else {
                    asset.name = decrypt(asset.name);
                    asset.login = 'hidden';
                    asset.password = 'hidden';
                    asset.website = decrypt(asset.website);
                }
                let trustees = [];
                if (asset.trusteeId) {
                    asset.trusteeId.forEach(trusteeId => {
                        "use strict";
                        let trustee = Meteor.users.findOne({_id: trusteeId._id});
                        delete trustee.services;
                        trustees.push(trustee);
                    });
                }
                return Object.assign(asset, {trustees: trustees, client: client, ok: 1});
            } else {
                return {ok: 0, message: 'Asset was canceled'};
            }
        },
        getClientsOfTrustee: (trustee, query) => {
            const finalClients = [];
            const filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            const clientIds = trustee.clientId;
            const clients = Meteor.users.find({_id: {$in: clientIds}, status: {$ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED}}, filterObject).fetch();
            const countOfAllItems = Meteor.users.find({_id: {$in: clientIds}, status: {$ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED}}).fetch().length;
            clients.forEach(client => {
                if (client) {
                    delete client.services;
                    finalClients.push(client);
                }
            });
            return {clients: finalClients, countOfAllItems};
        },
        getAssetsByTrusteeId: (trusteeId, query) => {
            const finalAssets = [];
            const filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            const assetIds = Meteor.users.findOne({_id: trusteeId}).assetId;

            if (assetIds) {
                let assets = Assets.find({_id: {$in: assetIds}, status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}}, filterObject);
                let countOfAllItems = Assets.find({_id: {$in: assetIds},status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}}).fetch().length;
                assets.forEach(asset => {
                    if (asset) {
                        let client = Meteor.users.findOne({_id: asset.clientId, status: {$ne: STATUS.numeric.CLIENT_ACCOUNT_DELETED}});
                        if (client) {
                            if (asset) {
                                asset.name = decrypt(asset.name);
                                asset.login = 'hidden';
                                asset.password = 'hidden';
                                asset.website = decrypt(asset.website);
                                finalAssets.push(asset);
                            }
                        }
                    }
                });
                return {finalAssets, countOfAllItems};
            }
        },
        getClientAssetsOfTrustee: (user, clientId, query) => {
            const finalAssets = [];
            const filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            const trustee = Meteor.users.findOne({_id: user._id});
            const client = Meteor.users.findOne({_id: clientId});
            const clientAssets = Assets.find({clientId: clientId, status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}}, filterObject).fetch();
            const countOfAllItems = Assets.find({clientId: clientId, status: {$ne: STATUS.numeric.DIGITAL_ASSET_DELETED}}).fetch().length;
            clientAssets.forEach(clientAsset => {
                if (trustee.assetId.includes(clientAsset._id)) {
                    clientAsset.name = decrypt(clientAsset.name);
                    clientAsset.login = 'hidden';
                    clientAsset.password = 'hidden';
                    clientAsset.website = decrypt(clientAsset.website);
                    finalAssets.push(clientAsset);
                }
            });
            return {finalAssets, countOfAllItems, client};
        },
        //-----------------------------------trustee's methods-------------------------------------------------
    });
}
