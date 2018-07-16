import {Meteor} from 'meteor/meteor';
import Future from 'fibers/future';
import moment from 'moment';
import stripe from 'stripe';
import schedule from 'node-schedule';

import {Assets, StripeSubscriptions, FutureEvents} from '../collections';
import {
    ROLE,
    STATUS,
    TEMPLATES,
    STRIPE_KEY,
    STRIPE_PLAN_ID,
    SUBSCRIPTION_STATUSES,
    ADMIN_EMAIL,
    ADMIN_ADDITIONAL_EMAIL
} from '../constants';
import {decrypt, encrypt} from './common';

const stripe_test = stripe(STRIPE_KEY);

if (Meteor.isServer) {
    Meteor.methods({
        //-----------------------------------estate planner's methods-------------------------------------------------
        getCustomerCardInfoById: estatePlannerId => {
            const myFuture = new Future();
            const subscriptionDB = StripeSubscriptions.findOne({estatePlannerId: estatePlannerId});
            if (subscriptionDB) {
                "use strict";
                subscriptionDB.customerId = decrypt(subscriptionDB.customerId);
                stripe_test.customers.retrieve(subscriptionDB.customerId, Meteor.bindEnvironment((err, customer) => {
                    if (err) {
                        return myFuture.throw(new Meteor.Error(err));
                    }
                    myFuture.return(customer);
                }));
            }
            return myFuture.wait();
        },
        updateEstatePlannerCard: (estatePlannerId, cardInfo) => {
            "use strict";
            const myFuture = new Future();
            const subscriptionDB = StripeSubscriptions.findOne({estatePlannerId: estatePlannerId});
            if (subscriptionDB) {
                "use strict";
                subscriptionDB.customerId = decrypt(subscriptionDB.customerId);
                stripe_test.customers.update(subscriptionDB.customerId, {source: cardInfo}, Meteor.bindEnvironment((err, customer) => {
                    if (err) {
                        return myFuture.throw(new Meteor.Error(err));
                    }
                    myFuture.return({message: `You've successfully updated card info`});
                }));
            }
            return myFuture.wait();
        },
        createEstatePlannerNoAuthentication: (id, estatePlanner) => {
            const myFuture = new Future();
            const tokenRecord = {
                token: Random.secret(),
                email: estatePlanner.email,
                when: new Date(),
                reason: 'enroll'
            };
            Meteor.users.update({_id: id}, {
                $set: {
                    'services.password.reset': tokenRecord,
                    tempPassword: estatePlanner.tempPassword,
                    'emails.0.createdAt': new Date(),
                    'emails.0.currentEmail': true
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                Roles.addUsersToRoles(id, [ROLE.ESTATE_PLANNER]);
                const enrollAccountUrl = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'estate-planner/set-password');
                Email.send({
                    from: ADMIN_EMAIL,
                    to: estatePlanner.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.TWO_FACTOR_AUTHENTICATION
                                    }
                                }
                            },
                            'sub': {
                                '%VerificationURL%': [enrollAccountUrl],
                                '%FirstName%,': [estatePlanner.profile.firstName]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });

                myFuture.return({message: 'You are successfully added as a new Estate Planner. TrustedHeir will email you and will guide you through authentication process.'});
            });
            return myFuture.wait();
        },
        createEstatePlannerNoPayment: (id, estatePlanner) => {
            const myFuture = new Future();
            Meteor.users.update({_id: id}, {
                $set: {
                    status: STATUS.numeric.ESTATE_PLANNER_NO_PAYMENT_INFO,
                    'emails.0.verified': true
                }, $unset: {'services.password.reset': 1, tempPassword: 1}
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                Email.send({
                    from: ADMIN_EMAIL,
                    to: estatePlanner.profile.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.ESTATE_PLANNER_WELCOME_EMAIL
                                    }
                                }
                            },
                            'sub': {
                                '%FirstName%': [estatePlanner.profile.firstName]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });
                myFuture.return({message: 'Account created'});
            });
            return myFuture.wait();
        },
        createEstatePlannerPayment: (id, estatePlanner) => {
            const myFuture = new Future();
            stripe_test.customers.create(estatePlanner, Meteor.bindEnvironment((err, customer) => {
                if (err) {
                    return myFuture.throw(new Meteor.Error(err));
                }
                const customerId = customer.id;

                // todo delete after tests
                // let nextDay = moment(new Date().setDate(new Date().getDate() + 1)).unix();
                const nextMonth = moment(new Date().setMonth(new Date().getMonth() + 1, 1)).unix();
                stripe_test.subscriptions.create({
                        customer: customerId,
                        plan: STRIPE_PLAN_ID,
                        quantity: 0,
                        // trial_end: nextDay
                        trial_end: nextMonth
                    }, Meteor.bindEnvironment((err, subscription) => {
                        if (err) {
                            return myFuture.throw(new Meteor.Error(err));
                        }
                        const subscriptionId = subscription.id;
                        Meteor.users.update({_id: id}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_PAYMENT_INFO}}, (err, cb) => {
                            if (err) {
                                myFuture.throw(err);
                            }
                            let invoiceInfo = {
                                estatePlannerId: id,
                                customerId: encrypt(customerId),
                                subscriptionId: encrypt(subscriptionId),
                                quantity: 0,
                                billingStatus: 'Paid',
                                createdAt: new Date()
                            };
                            StripeSubscriptions.insert(invoiceInfo, (err, cb) => {
                                if (err) {
                                    myFuture.throw(err);
                                }
                                myFuture.return({message: 'Account billing info created'});
                            });
                        });
                    })
                );
            }));
            return myFuture.wait();
        },
        createClientInvited: (id, client, estatePlanner) => {
            const myFuture = new Future();
            const tokenRecord = {
                token: Random.secret(),
                email: client.email,
                when: new Date(),
                reason: 'enroll'
            };
            Meteor.users.update({_id: id}, {
                $set: {
                    status: STATUS.numeric.CLIENT_INVITED,
                    estatePlannerId: estatePlanner._id,
                    'services.password.reset': tokenRecord,
                    'emails.0.createdAt': new Date(),
                    'emails.0.currentEmail': true
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                Roles.addUsersToRoles(id, [ROLE.CLIENT]);
                const enrollAccountUrl = Accounts.urls.enrollAccount(tokenRecord.token).replace('#/enroll-account', 'client/set-password');
                Email.send({
                    from: ADMIN_EMAIL,
                    to: client.email,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.CLIENT_INVITE
                                    }
                                }
                            },
                            'sub': {
                                '%VerificationURL%': [enrollAccountUrl],
                                '%ClientFirstName%': [client.profile.firstName],
                                '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });

                const subscription = StripeSubscriptions.findOne({estatePlannerId: estatePlanner._id});
                subscription.customerId = decrypt(subscription.customerId);
                subscription.subscriptionId = decrypt(subscription.subscriptionId);
                const quantity = subscription.quantity + 1;
                StripeSubscriptions.update({_id: subscription._id}, {$set: {quantity: quantity}}, (err, cb) => {
                    "use strict";
                    if (err) {
                        myFuture.throw(err);
                    }
                    stripe_test.subscriptions.update(
                        subscription.subscriptionId, {
                            quantity: quantity,
                        }, Meteor.bindEnvironment((err, subscription) => {
                            if (err) {
                                return myFuture.throw(new Meteor.Error(err));
                            }
                            const date = new Date(moment(new Date().setDate(new Date().getDate() + 3)).format('YYYY, M, D'));
                            const futureEvent3 = {
                                name: `Client 3-day Follow-up ${id}`,
                                type: 'Client 3-day Follow-up',
                                createdAt: new Date(),
                                date: date,
                                userId: id
                            };
                            FutureEvents.insert(futureEvent3);
                            const job3 = schedule.scheduleJob(futureEvent3.name, futureEvent3.date, Meteor.bindEnvironment(() => {
                                const myFuture = new Future();
                                const client = Meteor.users.findOne({_id: id});
                                FutureEvents.remove({name: `Client 3-day Follow-up ${id}`});
                                if (client.status === STATUS.numeric.CLIENT_INVITED) {
                                    Email.send({
                                        from: ADMIN_EMAIL,
                                        to: client.profile.email,
                                        headers: {
                                            'X-SMTPAPI': {
                                                'filters': {
                                                    'templates': {
                                                        'settings': {
                                                            'enable': 1,
                                                            'template_id': TEMPLATES.CLIENT_INVITE_THREE_DAY_FOLLOW_UP
                                                        }
                                                    }
                                                },
                                                'sub': {
                                                    '%VerificationURL%': [enrollAccountUrl],
                                                    '%ClientFirstName%': [client.profile.firstName],
                                                    '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                                                },
                                            },
                                            'Content-Type': 'text/html'
                                        }
                                    });
                                    const date = new Date(moment(new Date().setDate(new Date().getDate() + 4)).format('YYYY, M, D'));
                                    const futureEvent7 = {
                                        name: `Client 7-day Follow-up ${id}`,
                                        type: 'Client 7-day Follow-up',
                                        createdAt: new Date(),
                                        date: date,
                                        userId: id
                                    };
                                    FutureEvents.insert(futureEvent7);
                                    const job7 = schedule.scheduleJob(futureEvent7.name, futureEvent7.date, Meteor.bindEnvironment(() => {
                                        const myFuture = new Future();
                                        const client = Meteor.users.findOne({_id: id});
                                        FutureEvents.remove({name: `Client 3-day Follow-up ${id}`});
                                        if (client.status === STATUS.numeric.CLIENT_INVITED) {
                                            Email.send({
                                                from: ADMIN_EMAIL,
                                                to: client.profile.email,
                                                headers: {
                                                    'X-SMTPAPI': {
                                                        'filters': {
                                                            'templates': {
                                                                'settings': {
                                                                    'enable': 1,
                                                                    'template_id': TEMPLATES.CLIENT_INVITE_SEVEN_DAY_FOLLOW_UP
                                                                }
                                                            }
                                                        },
                                                        'sub': {
                                                            '%VerificationURL%': [enrollAccountUrl],
                                                            '%ClientFirstName%': [client.profile.firstName],
                                                            '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
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

                            const clients = Meteor.users.find({'estatePlannerId': estatePlanner._id}).fetch();
                            if (clients.length < 2) {

                                Meteor.users.update({_id: estatePlanner._id}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_ACTIVE}}, (err, cb) => {
                                    if (err) {
                                        myFuture.throw(err);
                                    }
                                    Email.send({
                                        from: ADMIN_EMAIL,
                                        to: estatePlanner.profile.email,
                                        headers: {
                                            'X-SMTPAPI': {
                                                'filters': {
                                                    'templates': {
                                                        'settings': {
                                                            'enable': 1,
                                                            'template_id': TEMPLATES.FIRST_CLIENT_ADDED
                                                        }
                                                    }
                                                },
                                                'sub': {
                                                    '%FirstName%': [estatePlanner.profile.firstName]
                                                },
                                            },
                                            'Content-Type': 'text/html'
                                        }
                                    });
                                    myFuture.return({message: `You've successfully added ${client.profile.firstName} ${client.profile.lastName} as a new client. TrustedHeir will email your Client and will guide them through creating their digital estate plan. You are active Estate Planner`});
                                });
                            } else myFuture.return({message: `You've successfully added ${client.profile.firstName} ${client.profile.lastName} as a new client. TrustedHeir will email your Client and will guide them through creating their digital estate plan.`});
                        }));
                });
            });
            return myFuture.wait();
        },
        addExistingClient: (email, estatePlanner) => {
            const myFuture = new Future();
            const existingClient = Accounts.findUserByEmail(email);
            if (existingClient.roles.includes(ROLE.ADMIN) || existingClient.roles.includes(ROLE.ESTATE_PLANNER)) {
                myFuture.return({message: `This user cannot be added as your client`});
            } else if (existingClient.estatePlannerId && existingClient.estatePlannerId === estatePlanner.id) {
                myFuture.return({message: `You've already added this client`});
            } else if (existingClient.roles.includes(ROLE.TRUSTEE) && !existingClient.emails[0].verified) {
                myFuture.return({message: `This user cannot be added as your trustee before finishing registration`});
            } else {
                Meteor.users.update({_id: existingClient._id}, {
                    $set: {
                        estatePlannerId: estatePlanner._id,
                    }
                }, (err, cb) => {
                    if (err) {
                        myFuture.throw(err);
                    }
                    Roles.addUsersToRoles(existingClient._id, [ROLE.CLIENT]);
                    const enrollAccountUrl = Meteor.absoluteUrl(`client/digital-assets`);
                    Email.send({
                        from: ADMIN_EMAIL,
                        to: email,
                        headers: {
                            'X-SMTPAPI': {
                                'filters': {
                                    'templates': {
                                        'settings': {
                                            'enable': 1,
                                            'template_id': TEMPLATES.CLIENT_INVITE
                                        }
                                    }
                                },
                                'sub': {
                                    '%VerificationURL%': [enrollAccountUrl],
                                    '%ClientFirstName%': [existingClient.profile.firstName],
                                    '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                                },
                            },
                            'Content-Type': 'text/html'
                        }
                    });

                    const subscription = StripeSubscriptions.findOne({estatePlannerId: estatePlanner._id});
                    subscription.customerId = decrypt(subscription.customerId);
                    subscription.subscriptionId = decrypt(subscription.subscriptionId);
                    const quantity = subscription.quantity + 1;
                    StripeSubscriptions.update({_id: subscription._id}, {$set: {quantity: quantity}}, (err, cb) => {
                        "use strict";
                        if (err) {
                            myFuture.throw(err);
                        }
                        stripe_test.subscriptions.update(subscription.subscriptionId, {quantity: quantity}, Meteor.bindEnvironment((err, subscription) => {
                            if (err) {
                                return myFuture.throw(new Meteor.Error(err));
                            }
                            const date = new Date(moment(new Date().setDate(new Date().getDate() + 3)).format('YYYY, M, D'));
                            const futureEvent3 = {
                                name: `Client 3-day Follow-up ${existingClient._id}`,
                                type: 'Client 3-day Follow-up',
                                createdAt: new Date(),
                                date: date,
                                userId: existingClient._id
                            };
                            FutureEvents.insert(futureEvent3);
                            const job3 = schedule.scheduleJob(futureEvent3.name, futureEvent3.date, Meteor.bindEnvironment(() => {
                                let myFuture = new Future();
                                let client = Meteor.users.findOne({_id: existingClient._id});
                                FutureEvents.remove({name: `Client 3-day Follow-up ${existingClient._id}`});
                                if (client.status === STATUS.numeric.CLIENT_INVITED) {
                                    Email.send({
                                        from: ADMIN_EMAIL,
                                        to: client.profile.email,
                                        headers: {
                                            'X-SMTPAPI': {
                                                'filters': {
                                                    'templates': {
                                                        'settings': {
                                                            'enable': 1,
                                                            'template_id': TEMPLATES.CLIENT_INVITE_THREE_DAY_FOLLOW_UP
                                                        }
                                                    }
                                                },
                                                'sub': {
                                                    '%VerificationURL%': [enrollAccountUrl],
                                                    '%ClientFirstName%': [client.profile.firstName],
                                                    '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
                                                },
                                            },
                                            'Content-Type': 'text/html'
                                        }
                                    });
                                    const date = new Date(moment(new Date().setDate(new Date().getDate() + 4)).format('YYYY, M, D'));
                                    const futureEvent7 = {
                                        name: `Client 7-day Follow-up ${existingClient._id}`,
                                        type: 'Client 7-day Follow-up',
                                        createdAt: new Date(),
                                        date: date,
                                        userId: existingClient._id
                                    };
                                    FutureEvents.insert(futureEvent7);
                                    const job7 = schedule.scheduleJob(futureEvent7.name, futureEvent7.date, Meteor.bindEnvironment(() => {
                                        let myFuture = new Future();
                                        let client = Meteor.users.findOne({_id: existingClient._id});
                                        FutureEvents.remove({name: `Client 3-day Follow-up ${existingClient._id}`});
                                        if (client.status === STATUS.numeric.CLIENT_INVITED) {
                                            Email.send({
                                                from: ADMIN_EMAIL,
                                                to: client.profile.email,
                                                headers: {
                                                    'X-SMTPAPI': {
                                                        'filters': {
                                                            'templates': {
                                                                'settings': {
                                                                    'enable': 1,
                                                                    'template_id': TEMPLATES.CLIENT_INVITE_SEVEN_DAY_FOLLOW_UP
                                                                }
                                                            }
                                                        },
                                                        'sub': {
                                                            '%VerificationURL%': [enrollAccountUrl],
                                                            '%ClientFirstName%': [client.profile.firstName],
                                                            '%EstatePlannerFullName%': [estatePlanner.profile.firstName + ' ' + estatePlanner.profile.lastName]
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

                            const clients = Meteor.users.find({'estatePlannerId': estatePlanner._id}).fetch();
                            if (clients.length < 2) {

                                Meteor.users.update({_id: estatePlanner._id}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_ACTIVE}}, (err, cb) => {
                                    if (err) {
                                        myFuture.throw(err);
                                    }
                                    Email.send({
                                        from: ADMIN_EMAIL,
                                        to: estatePlanner.profile.email,
                                        headers: {
                                            'X-SMTPAPI': {
                                                'filters': {
                                                    'templates': {
                                                        'settings': {
                                                            'enable': 1,
                                                            'template_id': TEMPLATES.FIRST_CLIENT_ADDED
                                                        }
                                                    }
                                                },
                                                'sub': {
                                                    '%FirstName%': [estatePlanner.profile.firstName]
                                                },
                                            },
                                            'Content-Type': 'text/html'
                                        }
                                    });
                                    myFuture.return({
                                        message: `You've successfully added ${existingClient.profile.firstName} ${existingClient.profile.lastName} as a new client. TrustedHeir will email your Client and will guide them through creating their digital estate plan. You are active Estate Planner`,
                                        client: existingClient
                                    });
                                });
                            } else myFuture.return({
                                message: `You've successfully added ${existingClient.profile.firstName} ${existingClient.profile.lastName} as a new client. TrustedHeir will email your Client and will guide them through creating their digital estate plan.`,
                                client: existingClient
                            });
                        }));
                    });
                });
            }
            return myFuture.wait();
        },
        cancelAccountByEstatePlanner: (user) => {
            "use strict";
            const myFuture = new Future();
            Meteor.users.update({_id: user._id}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_CLOSE_ACCOUNT_INITIATED}}, Meteor.bindEnvironment((err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                let enrollAccountUrl = Meteor.absoluteUrl(`admin/estate-planner-center/${user._id}`);
                Email.send({
                    from: user.profile.email,
                    to: ADMIN_ADDITIONAL_EMAIL,
                    headers: {
                        'X-SMTPAPI': {
                            'filters': {
                                'templates': {
                                    'settings': {
                                        'enable': 1,
                                        'template_id': TEMPLATES.ESTATE_PLANNER_CANCEL_ACCOUNT
                                    }
                                }
                            },
                            'sub': {
                                '%VerificationURL%': ['<a href="' + enrollAccountUrl + '">Link</a>'],
                                '%EstatePlannerFullName%': [`${user.profile.firstName} ${user.profile.lastName}`],
                                '%EstatePlannerEmail%': [user.profile.email],
                                '%DateRequested%': [moment().format("DD-MM-YYYY")],
                                '%TimeRequested%': [moment().format("HH:mm")],
                            },
                        },
                        'Content-Type': 'text/html'
                    }
                });
                const userNew = Meteor.users.findOne({_id: user._id});
                myFuture.return({message: 'You asked Admin to cancel your account!', user: userNew});
            }));
            return myFuture.wait();
        },
        reactivateAccountByEstatePlanner: user => {
            "use strict";
            const myFuture = new Future();
            Meteor.users.update({_id: user._id}, {$set: {status: STATUS.numeric.ESTATE_PLANNER_ACCOUNT_ACTIVE}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                const userNew = Meteor.users.findOne({_id: user._id});
                myFuture.return({message: 'Your account reactivated!', user: userNew});
            });
            return myFuture.wait();
        },
        getClients: estatePlannerId => {
            const clients = Meteor.users.find({estatePlannerId: estatePlannerId}).fetch();
            clients.forEach(client => {
                "use strict";
                delete client.services;
            });
            return clients;
        },
        getClientsForLastYear: estatePlannerId => {
            const allClientsByMonth = [];
            const monthDates = [];
            const estatePlanner = Meteor.users.find({
                _id: estatePlannerId
            }).fetch();
            const curDate = new Date();
            const differenceInMonths = Math.ceil(moment(curDate.setMonth(curDate.getMonth())).diff(moment(estatePlanner[0].createdAt), 'months', true));
            for (let i = 0; i < differenceInMonths; i++) {
                let month = moment().set({
                    'year': new Date().getMonth() - i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(),
                    'month': new Date().getMonth() - i < 0 ? 12 + (new Date().getMonth() - i) : new Date().getMonth() - i
                }).format('MMMM YYYY');
                let endOfMonth = moment().set({
                    'year': new Date().getMonth() - i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(),
                    'month': new Date().getMonth() - i < 0 ? 12 + (new Date().getMonth() - i) : new Date().getMonth() - i
                }).endOf('month').format('MMMM DD, YYYY');
                monthDates.push({month, endOfMonth});
                let clientsByMonth = Meteor.users.find({
                    estatePlannerId: estatePlannerId,
                    $where: `return this.createdAt.getMonth() == ${new Date().getMonth() - i < 0 ? 12 + (new Date().getMonth() - i) : new Date().getMonth() - i}`
                }).fetch();
                clientsByMonth.forEach(clientByMonth => {
                    "use strict";
                    delete clientByMonth.services;
                    clientByMonth.createdAt = moment(clientByMonth.createdAt).format('MMMM DD, YYYY');
                });
                allClientsByMonth.push(clientsByMonth);
            }

            const myFuture = new Future();
            const stripeSubscription = StripeSubscriptions.findOne({estatePlannerId: estatePlannerId});
            if (stripeSubscription) {
                stripeSubscription.customerId = decrypt(stripeSubscription.customerId);
                stripeSubscription.subscriptionId = decrypt(stripeSubscription.subscriptionId);
                stripe_test.invoices.retrieveUpcoming(stripeSubscription.customerId, Meteor.bindEnvironment((err, invoices) => {
                    if (err) {
                        return myFuture.throw(new Meteor.Error(err));
                    }
                    stripe_test.subscriptions.retrieve(stripeSubscription.subscriptionId, Meteor.bindEnvironment((err, subscription) => {
                        if (err) {
                            return myFuture.throw(new Meteor.Error(err));
                        }
                        const stripeInfo = {
                            subscriptionQuantity: subscription.quantity,
                            subscriptionStatus: SUBSCRIPTION_STATUSES[subscription.status],
                            amount_due: invoices.amount_due,
                            period_end: invoices.period_end
                        };
                        myFuture.return({monthDates, clientsByMonth: allClientsByMonth, stripeInfo});
                    }));
                }));
            } else myFuture.return({monthDates, clientsByMonth: allClientsByMonth});

            return myFuture.wait();
        },
        getClientsWithAssetsAndTrustees: (estatePlannerId, query) => {
            const clientsWithAssets = [];
            const filterObject = {
                sort: {createdAt: -1}
            };
            if (query) {
                filterObject.skip = query.skip;
                filterObject.limit = query.limit;
            }
            const clients = Meteor.users.find({estatePlannerId}, filterObject).fetch();
            const countOfAllItems = Meteor.users.find({estatePlannerId}).fetch().length;
            clients.forEach(client => {
                delete client.services;
                let assets = Assets.find({clientId: client._id}, {sort: {createdAt: -1}}).fetch();
                client.recentActivity ? client.recentActivity = moment(client.recentActivity.createdAt).format('ll') : client.recentActivity = moment(client.createdAt).format('ll');
                let trustees = Meteor.users.find({clientId: client._id}).fetch();
                let invitedTrustees = Meteor.users.find({'services.tokenClients.clientId': client._id}, {sort: {createdAt: -1}}).fetch();
                trustees.forEach(trustee => {
                    "use strict";
                    delete trustee.services;
                });
                invitedTrustees.forEach(invitedTrustee => {
                    "use strict";
                    delete invitedTrustee.services;
                });
                Object.assign(client, {assets: assets, trustees: trustees.concat(invitedTrustees)});
                clientsWithAssets.push(client);
            });
            return {clients: clientsWithAssets, countOfAllItems};
        },
        removeClient: client => {
            const myFuture = new Future();
            const estatePlanner = Meteor.users.findOne({_id: client.estatePlannerId});
            const profile = estatePlanner.profile;
            Meteor.users.update({_id: client._id}, {$set: {status: STATUS.numeric.CLIENT_ACCOUNT_DELETED}}, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                if (estatePlanner) {
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
                }
                myFuture.return({message: 'Account removed'});
            });
            return myFuture.wait();
        },
        reActivateClient: client => {
            const myFuture = new Future();
            Meteor.users.update({_id: client._id}, {
                $set: {
                    status: STATUS.numeric.CLIENT_ACTIVE
                }
            }, (err, cb) => {
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
                                        'template_id': TEMPLATES.CLIENT_ACCOUNT_REACTIVATED
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
                myFuture.return({message: 'Account re-activated'});
            });
            return myFuture.wait();
        },
        clientPostPassingInProgress: (deathInfo, client) => {
            const myFuture = new Future();
            Meteor.users.update({_id: client._id}, {
                $set: {
                    'profile.dateOfDeath': deathInfo.dateOfDeath,
                    'profile.deathCertificateNumber': deathInfo.deathCertificateNumber,
                    status: STATUS.numeric.POST_PASSING_IN_PROGRESS
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                myFuture.return({message: `You've successfully initiated the post-passing process for ${client.profile.firstName} ${client.profile.lastName}`});
            });
            return myFuture.wait();
        },
        assetPostPassingProcess: asset => {
            const myFuture = new Future();
            const client = Meteor.users.findOne({_id: asset.clientId});
            const trustees = Meteor.users.find({assetId: asset._id}, {sort: {createdAt: 1}}).fetch();
            const trusteesPostPassingList = [];
            const trusteesOrder = asset.trusteeId;
            trusteesOrder.sort((a, b) => {
                return a.order - b.order;
            });
            trusteesOrder.forEach(trusteeId => {
                trustees.forEach(trustee => {
                    if (trusteeId._id === trustee._id) {
                        trusteesPostPassingList.push(trustee);
                    }
                })
            });
            Assets.update({_id: asset._id}, {
                $set: {
                    status: STATUS.numeric.DIGITAL_ASSET_IN_POST_PASSING_PROCESS
                }
            }, (err, cb) => {
                if (err) {
                    myFuture.throw(err);
                }
                let primaryTrustee = trusteesPostPassingList[0];
                if (!primaryTrustee) {
                    myFuture.return({message: `This asset has no trustees`});
                } else {
                    const trusteeToken = {
                        token: Random.secret(),
                        when: new Date(),
                        reason: 'post-passing'
                    };
                    const assetURL = Meteor.absoluteUrl(`trustee/digital-asset/post-passing/${asset._id}?trusteeToken=${trusteeToken.token}`);
                    Meteor.users.update({_id: primaryTrustee._id}, {$push: {'services.trusteeToken': trusteeToken}}, (err, cb) => {
                        if (err) {
                            myFuture.throw(err);
                        }
                        Email.send({
                            from: ADMIN_EMAIL,
                            to: primaryTrustee.profile.email,
                            headers: {
                                'X-SMTPAPI': {
                                    'filters': {
                                        'templates': {
                                            'settings': {
                                                'enable': 1,
                                                'template_id': TEMPLATES.TRUSTEE_POST_PASSING
                                            }
                                        }
                                    },
                                    'sub': {
                                        '%TrusteeFirstName%': [primaryTrustee.profile.firstName],
                                        '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],
                                        '%ClientFirstName%': [client.profile.firstName],
                                        '%AssetURL%': [assetURL],
                                    },
                                },
                                'Content-Type': 'text/html'
                            }
                        });
                        let count = trusteesPostPassingList.length;
                        for (let i = 1; i < count; i++) {
                            const date = new Date(moment(new Date().setDate(new Date().getDate() + 90 * i)).format('YYYY, M, D'));
                            const futureEvent90 = {
                                name: `90-day Completed Asset ${asset._id} ${trusteesPostPassingList[i]._id}`,
                                type: '90-day Completed Asset',
                                createdAt: new Date(),
                                date: date,
                                userId: trusteesPostPassingList[i]._id
                            };
                            FutureEvents.insert(futureEvent90);
                            const job90 = schedule.scheduleJob(futureEvent90.name, futureEvent90.date, Meteor.bindEnvironment(() => {
                                let myFuture = new Future();
                                FutureEvents.remove({name: `90-day Completed Asset ${asset._id} ${trusteesPostPassingList[i]._id}`});
                                let currentAsset = Assets.findOne({_id: asset._id});
                                if (!currentAsset || (currentAsset && currentAsset.activeTrusteeId)) {
                                    myFuture.return({message: `You've successfully completed the post-passing process for ${asset.name}`});
                                } else if (trusteesPostPassingList[i].status === STATUS.numeric.POST_PASSING_IN_PROGRESS) {
                                    myFuture.return({message: `You cannot initiate the post-passing process for ${asset.name} because user is in post-passing`});
                                } else {
                                    let trusteeToken = {
                                        token: Random.secret(),
                                        when: new Date(),
                                        reason: 'post-passing'
                                    };
                                    let assetURL = Meteor.absoluteUrl(`trustee/digital-asset/post-passing/${asset._id}?trusteeToken=${trusteeToken.token}`);
                                    Meteor.users.update({_id: trusteesPostPassingList[i]._id}, {$push: {'services.trusteeToken': trusteeToken}}, (err, cb) => {
                                        if (err) {
                                            myFuture.throw(err);
                                        }
                                        Email.send({
                                            from: ADMIN_EMAIL,
                                            to: trusteesPostPassingList[i].profile.email,
                                            headers: {
                                                'X-SMTPAPI': {
                                                    'filters': {
                                                        'templates': {
                                                            'settings': {
                                                                'enable': 1,
                                                                'template_id': TEMPLATES.TRUSTEE_POST_PASSING
                                                            }
                                                        }
                                                    },
                                                    'sub': {
                                                        '%TrusteeFirstName%': [trusteesPostPassingList[i].profile.firstName],
                                                        '%ClientFullName%': [client.profile.firstName + ' ' + client.profile.lastName],
                                                        '%ClientFirstName%': [client.profile.firstName],
                                                        '%AssetURL%': [assetURL],
                                                    },
                                                },
                                                'Content-Type': 'text/html'
                                            }
                                        });
                                        myFuture.return({message: `You've successfully initiated the post-passing process for ${asset.name}`});
                                    });
                                }
                                return myFuture.wait();
                            }));
                        }
                        myFuture.return({message: `You've successfully initiated the post-passing process for ${asset.name}`});
                    });
                }
            });
            return myFuture.wait();
        }

        //-----------------------------------estate planner's methods-------------------------------------------------

    });
}
