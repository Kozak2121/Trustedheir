import {Meteor} from 'meteor/meteor';
import Future from 'fibers/future';
import moment from 'moment';
import schedule from 'node-schedule';

import {FutureEvents, StripeSubscriptions} from '../collections';
import {ROLE, STATUS, TEMPLATES, ADMIN_EMAIL} from '../constants';

if (Meteor.isServer) {
    Meteor.methods({
        //-----------------------------------admin's methods-------------------------------------------------
        getEstatePlanners: query => {
            const estatePlannersExtended = [];
            const filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            const estatePlanners = Meteor.users.find({roles: ROLE.ESTATE_PLANNER}, filterObject).fetch();
            const countOfAllItems = Meteor.users.find({roles: ROLE.ESTATE_PLANNER}).fetch().length;
            estatePlanners.forEach(estatePlanner => {
                if (estatePlanner) {
                    delete estatePlanner.services;
                    let totalClients = Meteor.users.find({
                        estatePlannerId: estatePlanner._id,
                        roles: 'client'
                    }).fetch().length;
                    let stripeSubscription = StripeSubscriptions.findOne({estatePlannerId: estatePlanner._id});
                    if (stripeSubscription) {
                        estatePlanner.billingStatus = stripeSubscription.billingStatus;
                    }
                    estatePlannersExtended.push(Object.assign(estatePlanner, {totalClients}));
                }
            });
            return {estatePlanners: estatePlannersExtended, countOfAllItems};
        },
        cancelEstatePlannerAccountImmediately: (estatePlannerId, isKeptClientAccounts) => {
            const myFuture = new Future();
            Meteor.users.update({_id: estatePlannerId}, {
                $set: {
                    dateOfClose: new Date(),
                    status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_CLOSED
                },
                $unset: {
                    dateOfSuspension: 1
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const estatePlanner = Meteor.users.findOne({_id: estatePlannerId});
                if (estatePlanner) {
                    const profile = estatePlanner.profile;
                    if (isKeptClientAccounts) {
                        Email.send({
                            from: ADMIN_EMAIL,
                            to: estatePlanner.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_ACTIVE
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                                    },
                                },
                                'Content-Type': 'text/html'
                            }
                        });
                    } else {
                        Email.send({
                            from: ADMIN_EMAIL,
                            to: estatePlanner.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_CLOSED
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                                    },
                                },
                                'Content-Type': 'text/html'
                            }
                        });
                    }
                    myFuture.return({message: `You've successfully canceled ${profile.firstName} ${profile.lastName} account`});
                } else {
                    return myFuture.wait();
                }
            });
            return myFuture.wait();
        },
        cancelEstatePlannerAccountOnDate: (estatePlannerId, dateOfClose, isKeptClientAccounts) => {
            const myFuture = new Future();
            Meteor.users.update({_id: estatePlannerId}, {
                $set: {
                    dateOfClose: dateOfClose
                },
                $unset: {
                    dateOfSuspension: 1
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const date = new Date(moment(dateOfClose).format('YYYY, M, D'));
                const futureEvent = {
                    name: `Cancel Estate Planner ${estatePlannerId}`,
                    type: 'Cancel Estate Planner',
                    createdAt: new Date(),
                    date: date,
                    userId: estatePlannerId
                };
                FutureEvents.insert(futureEvent);
                const job = schedule.scheduleJob(futureEvent.name, futureEvent.date, Meteor.bindEnvironment(() => {
                    const myFuture = new Future();
                    Meteor.users.update({_id: estatePlannerId}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_CLOSED}}, (err, cb) => {
                        if (err) {
                            myFuture.throw(err);
                        }
                        let estatePlanner = Meteor.users.findOne({_id: estatePlannerId});
                        if (estatePlanner) {
                            let profile = estatePlanner.profile;
                            if (isKeptClientAccounts) {
                                Email.send({
                                    from: ADMIN_EMAIL,
                                    to: estatePlanner.profile.email,
                                    headers: {
                                        'X-SMTPAPI': {
                                            'filters': {
                                                'templates': {
                                                    'settings': {
                                                        'enable': 1,
                                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_ACTIVE
                                                    }
                                                }
                                            },
                                            'sub': {
                                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                                            },
                                        },
                                        'Content-Type': 'text/html'
                                    }
                                });
                            } else {
                                Email.send({
                                    from: ADMIN_EMAIL,
                                    to: estatePlanner.profile.email,
                                    headers: {
                                        'X-SMTPAPI': {
                                            'filters': {
                                                'templates': {
                                                    'settings': {
                                                        'enable': 1,
                                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_CLOSED_CLIENT_ACCOUNTS_CLOSED
                                                    }
                                                }
                                            },
                                            'sub': {
                                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                                            },
                                        },
                                        'Content-Type': 'text/html'
                                    }
                                });
                            }
                            myFuture.return({
                                message: `You've successfully canceled ${profile.firstName} ${profile.lastName} account`,
                                estatePlanner: estatePlanner
                            });
                        } else {
                            return myFuture.wait();
                        }
                    });
                    return myFuture.wait();
                }));
                const estatePlanner = Meteor.users.findOne({_id: estatePlannerId});
                delete estatePlanner.services;
                myFuture.return({message: 'Account will cancel on the following date', estatePlanner: estatePlanner});
            });
            return myFuture.wait();
        },
        suspendEstatePlannerAccount: estatePlannerId => {
            const myFuture = new Future();
            Meteor.users.update({_id: estatePlannerId}, {
                $set: {
                    status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_SUSPENDED,
                    dateOfSuspension: new Date()
                },
                $unset: {
                    dateOfClose: 1
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const estatePlanner = Meteor.users.findOne({_id: estatePlannerId});
                delete estatePlanner.services;
                Email.send({
                    from: ADMIN_EMAIL,
                    to: estatePlanner.profile.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_SUSPENDED
                                    }
                                }
                            },
                            'sub': {
                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });
                myFuture.return({message: `You've successfully suspended account`, estatePlanner: estatePlanner});
            });
            return myFuture.wait();
        },
        reActivateEstatePlannerAccount: estatePlannerId => {
            const myFuture = new Future();
            Meteor.users.update({_id: estatePlannerId}, {
                $set: {status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_ACTIVE},
                $unset: {dateOfClose: 1, dateOfSuspension: 1}
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const futureEvent = FutureEvents.findOne({userId: estatePlannerId, type: 'Cancel Estate Planner'});
                if (futureEvent) {
                    const job = schedule.scheduledJobs[futureEvent.name];
                    if (job) {
                        job.cancel();
                        FutureEvents.remove({_id: futureEvent._id});
                    }
                }
                const estatePlanner = Meteor.users.findOne({_id: estatePlannerId});
                delete estatePlanner.services;
                Email.send({
                    from: ADMIN_EMAIL,
                    to: estatePlanner.profile.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.ESTATE_PLANNER_ACCOUNT_REACTIVATED
                                    }
                                }
                            },
                            'sub': {
                                '%EstatePlannerFirstName%': [estatePlanner.profile.firstName]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });
                myFuture.return({
                    message: `You've successfully reactivated ${estatePlanner.profile.firstName} ${estatePlanner.profile.lastName} account`,
                    estatePlanner: estatePlanner
                });
            });
            return myFuture.wait();
        },
        closeAllClients: estatePlannerId => {
            const myFuture = new Future();
            const estatePlanner = Meteor.users.findOne({_id: estatePlannerId});
            const profile = estatePlanner.profile;
            const clients = Meteor.users.find({estatePlannerId: estatePlannerId}).fetch();
            const errors = [];
            clients.forEach(client => {
                Meteor.users.update({_id: client._id}, {$set: {status: STATUS.numeric.CLIENT_ACCOUNT_DELETED}}, (err, cb) => {
                    if (err) {
                        errors.push(err);
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
                                            'template_id': TEMPLATES.CLIENT_ACCOUNT_CLOSED
                                        }
                                    }
                                },
                                'sub': {
                                    '%ClientFirstName%': [client.profile.firstName],
                                    '%EstatePlannerFullName%': [profile.firstName + ' ' + profile.lastName]
                                },
                            },
                            'Content-Type': 'text/html'
                        }
                    });
                });
            });
            if (errors.length) {
                myFuture.throw(errors[0]);
            }
            myFuture.return({message: `You've closed all clients accounts of ${profile.firstName} ${profile.lastName}`});
            return myFuture.wait();
        }
        //-----------------------------------admin's methods-------------------------------------------------
    });
}
